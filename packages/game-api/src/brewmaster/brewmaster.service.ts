import { ChainDocument, Chains } from '@app/shared/models/schemas';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { getRandomInt } from './game/math';
import { getClaimPointMessage } from '@app/shared/utils';
import { Web3Service } from '@app/web3/web3.service';
import { Account, ec, json, stark, RpcProvider, hash, CallData } from 'starknet';
import configuration from '@app/shared/configuration';
import axios from 'axios';
import * as dotenv from 'dotenv';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export type StarkSweepParam = {
  socket: Socket;
  collectedCoin: number;
  numberOfSpawnedCustomer: number;
  numberOfCustomerToCoin: number;
  numberOfCoinCanClaim: number;
  savedData: string;
  totalPoint: number;
};

@Injectable()
export class BrewMasterService {
  constructor(
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
    private readonly web3Service: Web3Service,
  ) {}
  private sockets: StarkSweepParam[] = [];

  private async sign_transaction(client: StarkSweepParam, address: string) {
    const chainDocument = await this.chainModel.findOne();
    const time = Math.round(new Date().getTime() / 1e3);
    let typedDataValidate = getClaimPointMessage(
      address,
      client.collectedCoin,
      time,
      chainDocument.name,
    );
    const provider = this.web3Service.getProvider(chainDocument.rpc);
    const signerAccount = new Account(
      provider,
      configuration().signer_wallet.address,
      configuration().signer_wallet.private_key,
    );
    const signature2 = await signerAccount.signMessage(typedDataValidate);
    const proof = stark.formatSignature(signature2);

    return {
      address,
      point: client.collectedCoin,
      timestamp: time,
      proof: proof,
    };
  }

  handleConnection(socket: Socket) {
    this.sockets.push({
      socket,
      collectedCoin: 0,
      numberOfCoinCanClaim: 0,
      numberOfSpawnedCustomer: 0,
      numberOfCustomerToCoin: 0,
      savedData: '',
      totalPoint: 0,
    });

    setTimeout(() => {
      socket.emit('connection', {
        date: new Date().getTime(),
        data: 'Hello Unity',
      });
    }, 1000);

    dotenv.config();
  }

  disconnectGame(socket: Socket) {
    this.sockets = this.sockets.filter((sk) => sk.socket !== socket);
  }

  handleSpawnCustomer(socket: Socket) {
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;
    client.numberOfSpawnedCustomer++;
    if (client.numberOfSpawnedCustomer >= client.numberOfCustomerToCoin) {
      client.socket.emit('spawnCoin');
      console.log('spawnCoin');
      client.numberOfCoinCanClaim++;
      client.numberOfSpawnedCustomer = 0;
      client.numberOfCustomerToCoin = getRandomInt(10, 20);
    }
  }

  handleCoinCollect(socket: Socket) {
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;
    console.log('Current collect coin: ' + client.collectedCoin);
    if (client.collectedCoin < client.numberOfCoinCanClaim) {
      client.collectedCoin++;
      console.log('Collected coin: ' + client.collectedCoin);
      client.socket.emit('updateCoin', client.collectedCoin.toString());
    }
  }

  async handleClaim(socket: Socket, address: string) {
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;
    const proof = await this.sign_transaction(client, address);
    client.socket.emit('updateProof', JSON.stringify(proof));
  }

  async handleAfterClaim(socket: Socket) {
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;
    client.collectedCoin = 0;
    client.socket.emit('updateCoin', client.collectedCoin.toString());
  }

  async handleAnonymousLogin(socket: Socket) {
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;

    console.log("Anonymous login: " + client.socket.id);

    // reset collected coin
    client.collectedCoin = 0;
    client.numberOfCoinCanClaim = 0;
    client.numberOfCustomerToCoin = 0;
    client.numberOfSpawnedCustomer = 0;
 
    // connect provider
    const chainDocument = await this.chainModel.findOne();
    const provider = new RpcProvider({ nodeUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7'});
    // const provider = new RpcProvider({ nodeUrl: chainDocument.rpc});

    //new Argent X account v0.3.0
    const argentXaccountClassHash = '0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003';

    // Generate public and private key pair.
    const privateKeyAX = stark.randomAddress();
    console.log('AX_ACCOUNT_PRIVATE_KEY=', privateKeyAX);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
    console.log('AX_ACCOUNT_PUBLIC_KEY=', starkKeyPubAX);

    // Calculate future address of the ArgentX account
    const AXConstructorCallData = CallData.compile({
      owner: starkKeyPubAX,
      guardian: '0',
    });
    const AXcontractAddress = hash.calculateContractAddressFromHash(
      starkKeyPubAX,
      argentXaccountClassHash,
      AXConstructorCallData,
      0
    );
    console.log('Precalculated account address=', AXcontractAddress);

    const str = JSON.stringify([AXcontractAddress, privateKeyAX]);
    client.socket.emit('updateAnonymous', str)
  }

  async handleSaveDataRequest(socket: Socket, data: string){
   // Save this data to server 
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;
    console.log("loadDataRequest");
    client.savedData = data;
    console.log(data);
  }

  async handleLoadDataRequest(socket: Socket) {
    // Load data
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;
    client.socket.emit('loadCallback', client.savedData);
  }

  async handleUpdateTotalPoint(socket: Socket){
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;

    client.socket.emit('totalPointCallback', client.totalPoint);
  }

  async handleShareToTwitterRequest(socket: Socket, message: string){
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;

    // currently will show message that is sended by client directly. Future will get content from server
    client.socket.emit('twitterRequestCallback', message);
  }

  extractTweetId(tweetUrl: string): string {
    if(typeof(tweetUrl) !== 'string') 
    {
      tweetUrl = String(tweetUrl);
      console.log(tweetUrl);
    }

    const urlParts = tweetUrl.split('/');
    return urlParts[urlParts.length - 1]; // The last part is the tweet ID
  }
  async getTweetContent(tweetUrl: string) {
    // Initialize OAuth
    const oauth = new OAuth({
      consumer: {
        key: 'Xl43f4DrqPscsmSqerwntoAy8', // Replace with your API Key
        secret: 'mTxdTwkaNIfMFQoPANMC5NEPXlvdT2QXDk18t8vuEkHJQXVqCd', // Replace with your API Key Secret
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
      },
    });

    const token = {
      key: '1366629980260605954-6p8ieHmbXR5KDtRS01BQ5ewWgNHrII', // Replace with your Access Token
      secret: 'mM2qNBLG4fUkdaAigu7WiT4X8eTZuZ800huEslrDc6EWa', // Replace with your Access Token Secret
    };
    
    const tweetId = this.extractTweetId(tweetUrl);
    const requestData = {
      url: `https://api.twitter.com/1.1/tweets/${tweetId}?tweet.fields=text`,
      method: 'GET',
    };
    const oauthHeaders = oauth.toHeader(oauth.authorize(requestData, token));
    const headers = {
      ...oauthHeaders, // Spread the OAuth headers
      'Content-Type': 'application/json', // Add any additional headers
    };

    try {
      const response = await axios.get(requestData.url, { headers })
      return response.data;
    } catch (error) {
      console.error('Error fetching tweet:', error);
    }

    // const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAABMbvgEAAAAAg%2F0jxqEKtirKhnBAC8zLFmk%2F7jQ%3D79pPYYjQsdp8dLeLVD8NhjMjiHv16W6MVNTVQtBTK2SYAXZuKi'; 
    // const url = `https://api.x.com/2/tweets/${tweetId}?tweet.fields=text`;

    // try
    // {
    //   const response = await axios.get(url, {
    //     headers: {
    //       'Authorization': `Bearer ${BEARER_TOKEN}`
    //     }
    //   });
    //   return response.data;
    // } catch (error) {
    //   console.error('Error fetching tweet:', error);
    // }
    // console.log(`Bearer ${BEARER_TOKEN}`)
  }

  async handlePlayerInputLink(socket: Socket, url: string) {
    const client = this.sockets.find((i) => i.socket == socket);

    if (client == undefined) return;

    this.getTweetContent(url).then(data => {
      console.log(data.text);
    });
  }
}
