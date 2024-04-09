import { BigNumberish, Contract, Provider, num } from 'starknet';
import { ABIS } from './types';
import { formattedContractAddress } from '@app/shared/utils';

export type TicketCreatedReturnValue = {
  ticketId: number;
  user: string;
  lotteryAddress: string;
  lotteryId: number;
  pickedNumbers: number[];
  boughtTime: number;
};

export const decodeTicketCreated = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): TicketCreatedReturnValue => {
  const contract = new Contract(
    ABIS.TicketABI,
    formattedContractAddress(txReceipt.events[0].from_address),
    provider,
  );
  const parsedEvent = contract.parseEvents(txReceipt)[0];
  const returnValue: TicketCreatedReturnValue = {
    ticketId: Number((parsedEvent.TicketCreated.ticketId as bigint).toString()),
    user: formattedContractAddress(
      num.toHex(parsedEvent.TicketCreated.user as BigNumberish),
    ),
    lotteryAddress: formattedContractAddress(
      num.toHex(parsedEvent.TicketCreated.lotteryAddress as BigNumberish),
    ),
    lotteryId: Number(
      (parsedEvent.TicketCreated.lotteryId as bigint).toString(),
    ),
    pickedNumbers: (parsedEvent.TicketCreated.pickedNumbers as bigint[]).map(
      (value) => Number(value.toString()),
    ),
    boughtTime: timestamp,
  };

  return returnValue;
};
