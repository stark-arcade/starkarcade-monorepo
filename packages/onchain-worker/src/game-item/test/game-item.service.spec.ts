import { Connection, Model, connect } from 'mongoose';
import { GameItemService } from '../game-item.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  ChainDocument,
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
  let web3Service: Web3Service;
  let provider: Provider;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    lotteryModel = mongoConnection.model(Lotteries.name, LotterySchema);
    ticketModel = mongoConnection.model(Tickets.name, TicketSchema);
    userModel = mongoConnection.model(Users.name, UserSchema);
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        GameItemService,
        Web3Service,
        UserService,
        { provide: getModelToken(Users.name), useValue: userModel },
        { provide: getModelToken(Lotteries.name), useValue: lotteryModel },
        { provide: getModelToken(Tickets.name), useValue: ticketModel },
      ],
    }).compile();
    gameService = app.get<GameItemService>(GameItemService);
    web3Service = app.get<Web3Service>(Web3Service);
    provider = new RpcProvider({ nodeUrl: chain.rpc });
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
    it('test', async () => {
      const trasactionReceipt = await provider.getTransactionReceipt(
        '0x030d41a499066a1463029275d114410de8a79a76dcdca4481ecb33c1aad787c9',
      );

      const block = await provider.getBlock(52111);
      const eventWithType = web3Service.getReturnValuesEvent(
        trasactionReceipt,
        chain as ChainDocument,
        block.timestamp * 1e3,
      );

      for (const event of eventWithType) {
        await gameService.processEvent(event, chain as ChainDocument);
      }

      const tickets = await ticketModel.find();
      console.log(tickets);
    });
  });
});
