import { Injectable } from '@nestjs/common';
import {
  Abi,
  Provider,
  GetTransactionReceiptResponse,
  Contract,
} from 'starknet';
import config from '@app/shared/configuration';
import { execSync } from 'child_process';
import { ChainDocument } from '@app/shared/models/schemas';
import { EventType, LogsReturnValues, LotteryDetail } from './types';
import { decodeTicketCreated } from './decode';
import LotteryAbi from './abi/lottery645.json';
import governanceAbi from './abi/governance.json';
import { LotteryDTO } from '@app/shared/models/dtos';
import { initPricerMultiplier } from './constant';
import { plainToInstance } from 'class-transformer';
import { formattedContractAddress } from '@app/shared/utils';

@Injectable()
export class Web3Service {
  getProvider(rpc: string) {
    const provider = new Provider({ nodeUrl: rpc });
    return provider;
  }

  async getBlockTime(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlock('latest');
    console.log(block);
    return block.timestamp;
  }

  async getLotteryDuration(
    rpc: string,
    lotteryAddress: string,
    chain: ChainDocument,
  ): Promise<number> {
    const provider = this.getProvider(rpc);
    const governanceContract = new Contract(
      governanceAbi,
      chain.governanceContract,
      provider,
    );

    const duration = await governanceContract.getDuration(lotteryAddress);
    return Number(duration.toString());
  }

  async getLotteryDetail(
    lotteryAddress: string,
    lotteryId: number,
    chain: ChainDocument,
  ): Promise<LotteryDTO> {
    const provider = this.getProvider(chain.rpc);
    const lotteryContract = new Contract(LotteryAbi, lotteryAddress, provider);

    const lotteryDetail: LotteryDetail =
      await lotteryContract.getLotteryById(lotteryId);

    const duration = await this.getLotteryDuration(
      chain.rpc,
      lotteryAddress,
      chain,
    );

    const lotteryEntity = {
      address: lotteryAddress,
      status: Number(lotteryDetail.state.toString()),
      lotteryId,
      ticketPrice: Number(lotteryDetail.minimumPrice.toString()) / 1e18,
      startTime: (Number(lotteryDetail.drawTime.toString()) - duration) * 1e3,
      drawTime: Number(lotteryDetail.drawTime.toString()) * 1e3,
      totalValue: Number(lotteryDetail.totalValue.toString()) / 1e18,
      jackpot: Number(lotteryDetail.jackpot.toString()) / 1e18,
      prizeMultipliers: initPricerMultiplier,
      drawnNumber: lotteryDetail.drawnNumbers.map((item) =>
        Number(item.toString()),
      ),
    };

    return plainToInstance(LotteryDTO, lotteryEntity);
  }

  getReturnValuesEvent(
    txReceipt: GetTransactionReceiptResponse,
    chain: ChainDocument,
    timestamp: number,
  ): LogsReturnValues[] {
    const eventWithType: LogsReturnValues[] = [];
    const provider = this.getProvider(chain.rpc);
    const eventBuyTickets = txReceipt.events.filter((ev) => {
      return formattedContractAddress(ev.from_address) == chain.ticketContract;
    });

    if (eventBuyTickets.length) {
      const eventTypes = decodeTicketCreated(
        txReceipt,
        timestamp,
        chain,
        provider,
      );
      for (const eventType of eventTypes) {
        eventWithType.push({
          eventType: EventType.TicketCreated,
          returnValues: eventType,
        });
      }
    }

    return eventWithType;
  }

  async invokeContractAsAdmin(
    rpc: string,
    contractAddress: string,
    abi: Abi,
    entrypoint: any,
  ) {
    // const provider = this.getProvider(rpc);
    // const contract = new Contract(abi, contractAddress, provider);

    // const adminAccount = new Account(
    //   provider,
    //   config().admin_wallet.account_address,
    //   config().admin_wallet.private_key,
    // );

    // contract.connect(adminAccount);

    // const rollCall = contract.populate(entrypoint, rawArgs);
    // console.log(rollCall);
    // const response = await contract[entrypoint](rollCall.calldata);
    // console.log(response);

    const cml = `starkli invoke ${contractAddress} ${entrypoint} --rpc ${rpc} --account ${config().admin_wallet.account_path} --keystore ${config().admin_wallet.keystore_path}`;
    const res = execSync(cml);
    console.log(res);
  }
}
