import { HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export function throwRpcError(statusCode: number, message: string): never {
  throw new RpcException({ statusCode, message });
}

export async function sendRpc<T>(
  client: ClientProxy,
  cmd: string,
  payload: unknown = {},
): Promise<T> {
  try {
    return await firstValueFrom(client.send<T>({ cmd }, payload));
  } catch (err: any) {
    const rpcErr = err?.error ?? err;
    const statusCode =
      typeof rpcErr?.statusCode === 'number'
        ? rpcErr.statusCode
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      typeof rpcErr?.message === 'string'
        ? rpcErr.message
        : 'Terjadi kesalahan pada layanan internal';

    throw new HttpException({ statusCode, message }, statusCode);
  }
}

