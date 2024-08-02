import {
  ChainDocument,
  Chains,
  TokenInfoDocument,
  TokenInfos,
} from '@app/shared/models/schemas';
import { formattedContractAddress } from '@app/shared/utils';
import { Web3Service } from '@app/web3/web3.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TokenInfoService {
  constructor(
    @InjectModel(TokenInfos.name)
    private readonly tokenInfoModel: Model<TokenInfoDocument>,
    @InjectModel(Chains.name)
    private readonly chainDocument: Model<ChainDocument>,
    private readonly web3Service: Web3Service,
  ) {}

  async getOrCreate(contractAddress: string): Promise<TokenInfoDocument> {
    const formattedAddress = formattedContractAddress(contractAddress);
    const existedToken = await this.tokenInfoModel.findOne({
      contractAddress: formattedAddress,
    });

    if (existedToken) {
      return existedToken;
    }

    const chainDocument = await this.chainDocument.findOne();
    const tokenInfo = await this.web3Service.getERC20TokenInfo(
      formattedAddress,
      chainDocument.rpc,
    );

    if (!tokenInfo) {
      return null;
    }

    const tokenEntity: TokenInfos = {
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      chain: chainDocument,
      decimals: tokenInfo.decimals,
      contractAddress: formattedAddress,
      enabled: false,
      isNative: false,
    };

    return await this.tokenInfoModel.findOneAndUpdate(
      { contractAddress: formattedAddress },
      { $set: tokenEntity },
      { new: true, upsert: true },
    );
  }
}
