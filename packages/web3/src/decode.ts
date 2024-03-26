import { Contract, GetTransactionReceiptResponse, Provider } from 'starknet';
import TicketABI from './abi/ticket.json';
import { Chains } from '@app/shared/models/schemas';

export type TicketCreatedReturnValue = {
  ticketId: number;
  user: string;
  lotteryAddress: string;
  lotteryId: number;
  pickedNumbers: number[];
  boughtTime: number;
};

export const decodeTicketCreated = (
  txReceipt: GetTransactionReceiptResponse,
  timestamp: number,
  chain: Chains,
  provider: Provider,
): TicketCreatedReturnValue[] => {
  const returnValues: TicketCreatedReturnValue[] = [];
  const contract = new Contract(TicketABI, chain.ticketContract, provider);
  const parsedEvents = contract.parseEvents(txReceipt);
  for (const event of parsedEvents) {
    event.TicketCreated.boughtTime = timestamp;
    returnValues.push(event.TicketCreated as TicketCreatedReturnValue);
  }

  return returnValues;
};
