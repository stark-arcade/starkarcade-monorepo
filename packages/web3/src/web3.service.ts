import { Injectable } from '@nestjs/common';
import {
  Abi,
  Provider,
  GetTransactionReceiptResponse,
  Contract,
} from 'starknet';
import config from '@app/shared/configuration';
import { execSync } from 'child_process';
import { ChainDocument, Lotteries } from '@app/shared/models/schemas';
import {
  EventTopic,
  EventType,
  LogsReturnValues,
  LotteryDetail,
} from './types';
import { decodeTicketCreated } from './decode';
import LotteryAbi from './abi/lottery645.json';
import governanceAbi from './abi/governance.json';
import { initPricerMultiplier } from './constant';
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
  ): Promise<Lotteries> {
    const provider = this.getProvider(chain.rpc);
    const lotteryContract = new Contract(LotteryAbi, lotteryAddress, provider);

    const lotteryDetail: LotteryDetail =
      await lotteryContract.getLotteryById(lotteryId);

    const lotteryEntity: Lotteries = {
      chain,
      address: lotteryAddress,
      status: Number(lotteryDetail.state.toString()),
      lotteryId,
      ticketPrice: Number(lotteryDetail.minimumPrice.toString()) / 1e18,
      startTime: Number(lotteryDetail.startTime.toString()) * 1e3,
      drawTime: Number(lotteryDetail.drawTime.toString()) * 1e3,
      jackpot: Number(lotteryDetail.jackpot.toString()) / 1e18,
      prizeMultipliers: initPricerMultiplier,
      drawnNumber: lotteryDetail.drawnNumbers.map((item) =>
        Number(item.toString()),
      ),
    };

    return lotteryEntity;
  }

  getReturnValuesEvent(
    txReceipt: GetTransactionReceiptResponse,
    chain: ChainDocument,
    timestamp: number,
  ): LogsReturnValues[] {
    const eventWithTypes: LogsReturnValues[] = [];
    const provider = this.getProvider(chain.rpc);

    if (txReceipt.isSuccess()) {
      for (const event of txReceipt.events) {
        const txReceiptFilter = {
          ...txReceipt,
          events: txReceipt.events.filter((ev) => ev == event),
        };

        if (
          event.keys.includes(EventTopic.TICKET_CREATED) &&
          formattedContractAddress(event.from_address) === chain.ticketContract
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.TicketCreated,
            returnValues: decodeTicketCreated(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        }
      }

      return eventWithTypes;
    }
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
