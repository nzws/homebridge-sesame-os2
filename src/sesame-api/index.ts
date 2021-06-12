import got from 'got';
import * as NodeAesCmac from 'node-aes-cmac';
import {
  Sesame2Cmd,
  Sesame2CmdRequest,
  Sesame2HistoryResponse,
  Sesame2StatusResponse
} from './type';

const API_ENDPOINT = 'https://app.candyhouse.co/api';

type Options = {
  isQRSecret?: boolean;
  displayName?: string;
};

export class SesameAPI {
  private baseUrl: string;
  private headers: {
    'x-api-key': string;
  };

  constructor(
    accessToken: string,
    UUID: string,
    private secret: string,
    private options?: Options
  ) {
    this.baseUrl = `${API_ENDPOINT}/sesame2/${UUID}`;
    this.headers = {
      'x-api-key': accessToken
    };
  }

  public async getStatus(): Promise<Sesame2StatusResponse> {
    const { body } = await got<Sesame2StatusResponse>(`${this.baseUrl}`, {
      headers: this.headers,
      responseType: 'json'
    });

    return body;
  }

  public async getHistory(page = 0, lg = 20): Promise<Sesame2HistoryResponse> {
    const { body } = await got<Sesame2HistoryResponse>(
      `${this.baseUrl}/history`,
      {
        searchParams: {
          page,
          lg
        },
        headers: this.headers,
        responseType: 'json'
      }
    );

    return body;
  }

  public async runCommand(cmd: Sesame2Cmd): Promise<void> {
    const history = Buffer.from(
      this.options?.displayName || 'SesameAPI.js'
    ).toString('base64');

    const json: Sesame2CmdRequest = {
      cmd,
      history,
      sign: this._generateTag()
    };

    await got.post(`${this.baseUrl}/cmd`, {
      json,
      headers: this.headers,
      responseType: 'json'
    });
  }

  private _generateTag(): string {
    // https://doc.candyhouse.co/ja/SesameAPI#%E3%82%B3%E3%83%BC%E3%83%89-%E7%94%A8%E4%BE%8B
    let secret = this.secret;
    if (this.options?.isQRSecret) {
      secret = Buffer.from(this.secret, 'base64').slice(1, 17).toString('hex');
    }
    // * key:key-secret_hex to data
    const key = Buffer.from(secret, 'hex');

    // message
    // 1. timestamp  (SECONDS SINCE JAN 01 1970. (UTC))  // 1621854456905
    // 2. timestamp to uint32  (little endian)   //f888ab60
    // 3. remove most-significant byte    //0x88ab60
    const date = Math.floor(Date.now() / 1000);
    const dateDate = Buffer.allocUnsafe(4);
    dateDate.writeUInt32LE(date);
    const message = Buffer.from(dateDate.slice(1, 4));

    return NodeAesCmac.aesCmac(key, message) as string;
  }
}
