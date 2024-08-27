import { Injectable, Logger } from '@nestjs/common';
import { BlockedQueue } from '@app/shared/BlockedQueue';
import { delay } from '@app/shared/utils/promise';
import { Socket } from 'socket.io';
import {
  Account,
  RpcProvider,
  CallData,
  Call,
  stark,
  Contract,
  num,
  BigNumberish,
} from 'starknet';
import { InjectModel } from '@nestjs/mongoose';
import { ChainDocument, Chains } from '@app/shared/models/schemas';
import { Model } from 'mongoose';
import configuration from '@app/shared/configuration';
import { getSettleMessage } from '@app/shared/utils';
import { ABIS } from '@app/web3/types';
import { StarkFlipEvents } from '@app/shared/types';

export type SettleParam = {
  client: Socket;
  gameId: string;
  guess: number;
  seed: string;
};

export type ResultParam = {
  games: SettleParam[];
  resultTx: string;
};

@Injectable()
export class SettleWorker {
  gameBuffer: BlockedQueue<SettleParam>;
  resultBuffer: BlockedQueue<ResultParam>;
  shutdown = false;
  private running = false;
  get isRunning(): boolean {
    return this.running;
  }
  name: string;

  logger: Logger;
  processing = false;

  dealerAccount: Account;
  provider: RpcProvider;
  chainDocument: ChainDocument;

  constructor(
    @InjectModel(Chains.name) private readonly chain: Model<ChainDocument>,
  ) {
    this.gameBuffer = new BlockedQueue<SettleParam>(1000);
    this.resultBuffer = new BlockedQueue<ResultParam>(1000);
    this.logger = new Logger(SettleWorker.name);
  }

  putGame(gameParam: SettleParam) {
    this.gameBuffer.put(gameParam);
  }

  private async process(games: SettleParam[]) {
    const multiCallParam: Call[] = [];
    for (const game of games) {
      const { gameId, guess, seed } = game;
      const message = getSettleMessage(gameId, guess, seed);
      const signature = await this.dealerAccount.signMessage(message);
      const proof = stark.formatSignature(signature);

      try {
        await this.dealerAccount.estimateInvokeFee({
          contractAddress: this.chainDocument.starkFlipContract,
          entrypoint: 'settle',
          calldata: CallData.compile({
            game_id: gameId,
            signature: proof,
          }),
        });
      } catch (error) {
        if ((error.message as string).includes('STARKFLIP: Invalid Game')) {
          continue;
        }
      }

      multiCallParam.push({
        contractAddress: this.chainDocument.starkFlipContract,
        entrypoint: 'settle',
        calldata: CallData.compile({
          game_id: gameId,
          signature: proof,
        }),
      });
    }

    if (multiCallParam.length > 0) {
      this.logger.debug(`Found ${multiCallParam.length} games created`);

      const result = await this.dealerAccount.execute(multiCallParam);
      await this.provider.waitForTransaction(result.transaction_hash);
      this.resultBuffer.put({ games, resultTx: result.transaction_hash });
    }
  }

  private async processSettle() {
    while (!this.shutdown) {
      const datas = await this.gameBuffer.takeAll();
      let done = false;
      while (!done) {
        try {
          await this.process(datas);
          done = true;
        } catch (error) {
          this.logger.error(error.message);
          this.logger.warn('Fail of process handle. Try again ...');
          await delay(1);
        }
      }
    }
  }

  private async processEmitResult() {
    while (!this.shutdown) {
      const result = await this.resultBuffer.take();
      let done = false;
      while (!done) {
        try {
          const { games, resultTx } = result;
          const txReceipt = await this.provider.getTransactionReceipt(resultTx);
          const contract = new Contract(
            ABIS.StarkFlipAbi,
            this.chainDocument.starkFlipContract,
            this.provider,
          );

          const parsedEvs = contract.parseEvents(txReceipt);
          for (const ev of parsedEvs) {
            const { game_id: gameIdBigInt, is_won: isWon } = ev.SettleGame;

            const gameId = num.toHex(gameIdBigInt as BigNumberish);
            const game = games.find((i) => i.gameId == gameId);

            game.client.emit(StarkFlipEvents.GAME_RESULT, { isWon });
          }
          done = true;
        } catch (error) {
          this.logger.error(error, error.stack);
          this.logger.warn('Fail of process emit result. Try again ...');
          await delay(1);
        }
      }
    }
  }

  private async init() {
    this.chainDocument = await this.chain.findOne();
    // this.provider = new RpcProvider({ nodeUrl: this.chainDocument.rpc });
    this.provider = new RpcProvider({ nodeUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7'});
    this.dealerAccount = new Account(
      this.provider,
      configuration().dealer_wallet.address,
      configuration().dealer_wallet.private_key,
    );
  }

  async start() {
    if (this.running) return;
    this.running = true;
    this.shutdown = false;
    this.logger.log('started');
    await this.init();
    await Promise.all([this.processSettle(), this.processEmitResult()]);
    this.running = false;
    this.logger.log('stopped');
  }
  onApplicationShutdown(): void {
    this.shutdown = true;
  }
  stop() {
    this.shutdown = true;
  }
}
