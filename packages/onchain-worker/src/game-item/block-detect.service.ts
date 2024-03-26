import { Model } from 'mongoose';
import configuration from '@app/shared/configuration';
import { OnchainWorker } from '../OnchainWorker';
import {
  BlockDocument,
  BlockWorkerStatus,
  ChainDocument,
  retryUntil,
} from '@app/shared/models/schemas';
import { Web3Service } from '@app/web3/web3.service';
import { BlockStatus, Block, Provider, RpcProvider } from 'starknet';
import { arraySliceProcess } from '@app/shared/utils/arrayLimitProcess';
import { GameItemService } from './game-item.service';

export class BlockDetectService extends OnchainWorker {
  constructor(
    blockModel: Model<BlockDocument>,
    web3Service: Web3Service,
    chain: ChainDocument,
    gameService: GameItemService,
  ) {
    super(1000, 10, `${BlockDetectService.name}:${chain.name}`);
    this.logger.log('Created');
    this.web3Service = web3Service;
    this.gameService = gameService;
    this.chain = chain;
    this.chainId = chain.id;
    this.blockModel = blockModel;
  }
  chainId: string;
  web3Service: Web3Service;
  provider: Provider;
  chain: ChainDocument;
  gameService: GameItemService;
  blockModel: Model<BlockDocument>;

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
    console.log(latestBlock);
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

    const batchProcess = 20;
    const maxRetry = 10;
    //batch process 10 txs, max retry 10 times
    await arraySliceProcess(
      block.transactions,
      async (txs) => {
        await Promise.all(
          txs.map(async (tx) => {
            await retryUntil(
              async () => this.processTx(tx, block.block_number),
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

  async processTx(txHash: string, blockNumber: number) {
    const trasactionReceipt = await this.provider.getTransactionReceipt(txHash);
    if (!trasactionReceipt) {
      // throw new Error(`Can not get transaction receipt ${txHash}`);
      return undefined;
    }

    //parse event
    const timestamp =
      (await this.provider.getBlock(blockNumber)).timestamp * 1e3;
    const eventWithType = this.web3Service.getReturnValuesEvent(
      trasactionReceipt,
      this.chain,
      timestamp,
    );

    //process event
    for (const event of eventWithType) {
      await this.gameService.processEvent(event, this.chain);
    }
    return trasactionReceipt;
  }
}
