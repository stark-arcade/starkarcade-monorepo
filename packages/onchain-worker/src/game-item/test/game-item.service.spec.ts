import { Connection, Model, connect } from 'mongoose';
import { GameItemService } from '../game-item.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
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

describe('GameItemService', () => {
  let gameService: GameItemService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let lotteryModel: Model<Lotteries>;
  let ticketModel: Model<Tickets>;
  let userModel: Model<Users>;
  let chainModel: Model<Chains>;
  let web3Service: Web3Service;
  let provider: Provider;
  let chainDocument: ChainDocument;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    lotteryModel = mongoConnection.model(Lotteries.name, LotterySchema);
    ticketModel = mongoConnection.model(Tickets.name, TicketSchema);
    userModel = mongoConnection.model(Users.name, UserSchema);
    chainModel = mongoConnection.model(Chains.name, ChainSchema);
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

      const lottery = await lotteryModel.findOne();
      const ticket = await ticketModel.findOne();
      const user = await userModel.findOne();
      console.log({ lottery, ticket, user });
    });
  });
});
