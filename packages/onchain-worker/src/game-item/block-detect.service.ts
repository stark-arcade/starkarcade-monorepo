import { Model } from 'mongoose';
import configuration from '@app/shared/configuration';
import { OnchainWorker } from '../OnchainWorker';
import {
  BlockDocument,
  BlockWorkerStatus,
  ChainDocument,
} from '@app/shared/models/schemas';
import { Web3Service } from '@app/web3/web3.service';
import { BlockStatus, Block, Provider, RpcProvider } from 'starknet';
import { arraySliceProcess } from '@app/shared/utils/arrayLimitProcess';
import { EventType, LogsReturnValues } from '@app/web3/types';
import { Queue } from 'bull';
import { OnchainQueueService } from './queue/onchainQueue';
import { ONCHAIN_JOBS } from '@app/shared/types';
import { retryUntil } from '@app/shared/utils';

export class BlockDetectService extends OnchainWorker {
  constructor(
    createGameQueue: Queue<LogsReturnValues>,
    settleGameQueue: Queue<LogsReturnValues>,
    onchainQueue: OnchainQueueService,
    blockModel: Model<BlockDocument>,
    web3Service: Web3Service,
    chain: ChainDocument,
  ) {
    super(1000, 10, `${BlockDetectService.name}:${chain.name}`);
    this.logger.log('Created');
    this.web3Service = web3Service;
    this.chain = chain;
    this.chainId = chain.id;
    this.blockModel = blockModel;
    this.createGameQueue = createGameQueue;
    this.settleGameQueue = settleGameQueue;
    this.onchainQueue = onchainQueue;
  }
  chainId: string;
  web3Service: Web3Service;
  provider: Provider;
  chain: ChainDocument;
  blockModel: Model<BlockDocument>;
  createGameQueue: Queue<LogsReturnValues>;
  settleGameQueue: Queue<LogsReturnValues>;
  onchainQueue: OnchainQueueService;

  fetchLatestBlock: () => Promise<number> = async () => {
    const latestBlock = await this.provider.getBlock('latest');
    return latestBlock.block_number - Number(this.chain.delayBlock || 0);
  };

  init = async () => {
    const latestBlock = await this.blockModel
      .findOne({
        status: BlockWorkerStatus.SUCCESS,
      })
      .sort({ blockNumber: -1 });
    this.currentBlock =
      (latestBlock?.blockNumber || configuration().beginBlock - 1) + 1;
    this.provider = new RpcProvider({ nodeUrl: this.chain.rpc });
    this.logger.log(`chain: ${JSON.stringify(this.chain)}`);
  };

  fillBlockDataBuffer = async (
    blocks: number[],
  ): Promise<{ [k: number]: Block }> => {
    const dataBlocks = await Promise.all(
      blocks.map(async (b) => this.provider.getBlock(b)),
    );

    const groupByBlock: { [k: number]: Block } = dataBlocks.reduce(
      (acc, cur) => {
        if (
          cur.status == BlockStatus.ACCEPTED_ON_L2 ||
          cur.status == BlockStatus.ACCEPTED_ON_L1
        ) {
          acc[cur.block_number] = cur;
          return acc;
        }
      },
      {},
    );

    return groupByBlock;
  };

  process = async (block: Block): Promise<void> => {
    const beginTime = Date.now();
    this.logger.debug(
      `begin process block ${Number(block.block_number)} ${
        block.transactions.length
      } txs`,
    );
    //insert to db
    const blockEntity = await this.blockModel.findOneAndUpdate(
      {
        blockNumber: block.block_number,
        chain: this.chainId,
      },
      {
        $setOnInsert: {
          blockNumber: block.block_number,
          chain: this.chainId,
          transactions: block.transactions,
          status: BlockWorkerStatus.PENDING,
          timestamp: block.timestamp * 1e3,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    const batchProcess = 10;
    const maxRetry = 10;
    //batch process 10 txs, max retry 10 times
    await arraySliceProcess(
      block.transactions,
      async (txs) => {
        await Promise.all(
          txs.map(async (tx) => {
            await retryUntil(
              async () => this.processTx(tx, block.timestamp * 1e3),
              () => true,
              maxRetry,
            );
          }),
        );
      },
      batchProcess,
    );
    blockEntity.status = BlockWorkerStatus.SUCCESS;
    await blockEntity.save();

    this.logger.debug(
      `end process block ${Number(block.block_number)} ${block.transactions.length}txs in ${
        Date.now() - beginTime
      }ms`,
    );
  };

  async processTx(txHash: string, timestamp: number) {
    const trasactionReceipt = await this.provider.getTransactionReceipt(txHash);
    if (!trasactionReceipt) {
      // throw new Error(`Can not get transaction receipt ${txHash}`);
      return undefined;
    }

    //parse event
    const eventWithType = this.web3Service.getReturnValuesEvent(
      trasactionReceipt,
      this.chain,
      timestamp,
    );

    //process event
    for (const event of eventWithType) {
      let queue: Queue<LogsReturnValues> = null;
      let jobName: string = null;

      switch (event.eventType) {
        case EventType.CreateGame:
          queue = this.createGameQueue;
          jobName = ONCHAIN_JOBS.JOB_CREATE_GAME;
          break;
        case EventType.SettleGame:
          queue = this.settleGameQueue;
          jobName = ONCHAIN_JOBS.JOB_SETTLE_GAME;
          break;
      }
      if (queue && jobName) {
        await this.onchainQueue.add(queue, jobName, event);
      }
    }
    return trasactionReceipt;
  }
}
