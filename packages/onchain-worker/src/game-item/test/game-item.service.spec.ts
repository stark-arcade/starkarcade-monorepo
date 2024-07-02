import { Connection, Model, connect } from 'mongoose';
import { GameItemService } from '../../../../onchain-queue/src/game-item.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  BlockDocument,
  BlockSchema,
  Blocks,
  ChainDocument,
  ChainSchema,
  Chains,
  Lotteries,
  LotterySchema,
  TicketSchema,
  Tickets,
  UserSchema,
  Users,
} from '@app/shared/models/schemas';
import { Web3Service } from '@app/web3/web3.service';
import { UserService } from '../../users/user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Provider, RpcProvider } from 'starknet';
import chain from './mocks/chain.json';
import lottery from './mocks/lottery.json';
import tickets from './mocks/tickets.json';
import { BlockDetectService } from '../block-detect.service';

describe('GameItemService', () => {
  let gameService: GameItemService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let lotteryModel: Model<Lotteries>;
  let ticketModel: Model<Tickets>;
  let userModel: Model<Users>;
  let chainModel: Model<Chains>;
  let blockModel: Model<BlockDocument>;
  let web3Service: Web3Service;
  let provider: Provider;
  let chainDocument: ChainDocument;
  let blockDetectionService: BlockDetectService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    lotteryModel = mongoConnection.model(Lotteries.name, LotterySchema);
    ticketModel = mongoConnection.model(Tickets.name, TicketSchema);
    userModel = mongoConnection.model(Users.name, UserSchema);
    chainModel = mongoConnection.model(Chains.name, ChainSchema);
    blockModel = mongoConnection.model<BlockDocument>(Blocks.name, BlockSchema);
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        GameItemService,
        Web3Service,
        UserService,
        { provide: getModelToken(Users.name), useValue: userModel },
        { provide: getModelToken(Lotteries.name), useValue: lotteryModel },
        { provide: getModelToken(Tickets.name), useValue: ticketModel },
        { provide: getModelToken(Chains.name), useValue: chainModel },
      ],
    }).compile();
    gameService = app.get<GameItemService>(GameItemService);
    web3Service = app.get<Web3Service>(Web3Service);
    provider = new RpcProvider({ nodeUrl: chain.rpc });
    chainDocument = await chainModel.create(chain);
    await lotteryModel.create(lottery);
    await ticketModel.insertMany(tickets);

    blockDetectionService = new BlockDetectService(
      blockModel,
      web3Service,
      chainDocument,
      gameService,
    );

    await blockDetectionService.init();
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('test', () => {
    it('processTicketCreated', async () => {
      const trasactionReceipt = await provider.getTransactionReceipt(
        '0x0546dee18573d57cc9351054dc1d9775d9ba21ef78f199176295227c85af46a3',
      );

      const block = await provider.getBlock(57516);
      const eventWithType = web3Service.getReturnValuesEvent(
        trasactionReceipt,
        chainDocument,
        block.timestamp * 1e3,
      );

      for (const event of eventWithType) {
        await gameService.processEvent(event, chainDocument);
      }

      // const lottery = await lotteryModel.findOne();
      const drawnNumber = [2, 35, 31, 37, 20, 32];
      const ticket = await ticketModel.aggregate([
        {
          $match: {
            pickedNumbers: { $elemMatch: { $in: drawnNumber } },
          },
        },
        {
          $addFields: {
            matchingNumbersCount: {
              $size: {
                $setIntersection: ['$pickedNumbers', drawnNumber], // Specify your array A here
              },
            },
          },
        },
        {
          $match: {
            matchingNumbersCount: { $gte: 2 },
          },
        },
      ]);
      // const user = await userModel.findOne();
      console.log(ticket);
    });
  });

  it('processNewLotteryCreated', async () => {
    const block = await provider.getBlock(57516);
    await blockDetectionService.processTx(
      '0x03610b4f8b14ad00921353ef858cbc31a45bbb921fe83e390ea4c98abd7836d7',
      block.timestamp * 1e3,
    );

    const lottery = await lotteryModel.findOne();
    console.log({ lottery });
  });

  it('processDrawnNumbers', async () => {
    const block = await provider.getBlock(57569);
    await blockDetectionService.processTx(
      '0x0257559695c155f6e243ff687a0141ff7eb2d4ad5d8c5a9e4134169fcdd314a6',
      block.timestamp * 1e3,
    );

    const ticket = await ticketModel.find();
    console.log(ticket);
  });
});
