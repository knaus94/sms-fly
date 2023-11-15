import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface SuccessResponse<T> {
  success: 1;
  date: Date;
  data: T;
}

interface ErrorResponse {
  success: 0;
  error: {
    code: string;
    date: Date;
    description: string;
  };
}

enum ActionTypeEnum {
  SENDMESSAGE = 'SENDMESSAGE',
}

interface Auth {
  key: string;
}

interface ApiBody<N extends ActionTypeEnum, T> {
  auth: Auth;
  action: N;
  data: T;
}

interface SendMessageRequest {
  recipient: string;
  channels: string[];
  viber?: {
    source: string;
    ttl: number;
    text: string;
    button?: {
      caption: string;
      url: string;
    };
    image?: string;
  };
  sms?: {
    source: string;
    ttl: number;
    flash?: number;
    text: string;
  };
}

type Response<T> = SuccessResponse<T> | ErrorResponse;

type SendMessageResponse = Response<{
  messageID: string;
  viber?: {
    status: string;
    date: string;
    label: string;
    cost: number;
  };
  sms?: {
    status: string;
    date: string;
    cost: number;
  };
}>;

type ApiRequest<T extends ActionTypeEnum> = T extends ActionTypeEnum.SENDMESSAGE
  ? SendMessageRequest
  : never;
type ApiResponse<T extends ActionTypeEnum> =
  T extends ActionTypeEnum.SENDMESSAGE ? SendMessageResponse : never;

class SmsFlyWebApi {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T extends ActionTypeEnum>(
    config: AxiosRequestConfig,
  ) {
    try {
      const response: AxiosResponse<Response<ApiResponse<T>>> = await axios(
        config,
      );
      return response.data;
    } catch (e) {
      if (e.response?.data && e.response?.data?.success === 0) {
        return e.response.data as ErrorResponse;
      }

      throw e;
    }
  }

  protected async request<T extends ActionTypeEnum>(
    action: T,
    requestData: ApiRequest<T>,
  ) {
    const requestConfig: AxiosRequestConfig<ApiBody<T, ApiRequest<T>>> = {
      method: 'post',
      url: 'https://sms-fly.ua/api/v2/api.php',
      data: {
        auth: { key: this.apiKey },
        action,
        data: requestData,
      },
      timeout: 10000,
    };

    return this.makeRequest<T>(requestConfig);
  }

  public async sendMessage(data: SendMessageRequest) {
    return this.request(ActionTypeEnum.SENDMESSAGE, data);
  }
}

export default SmsFlyWebApi;
