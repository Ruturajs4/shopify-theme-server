import { config } from '../config/environment';

export class BasicAuthService {
  private readonly username: string;
  private readonly password: string;

  constructor() {
    this.username = config.WEBHOOK_USERNAME;
    this.password = config.WEBHOOK_PASSWORD;
  }

  /**
   * Generates Basic Authentication header value
   * @returns Base64 encoded Basic Auth string
   */
  public getAuthHeader(): string {
    const credentials = `${this.username}:${this.password}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    return `Basic ${encodedCredentials}`;
  }

  /**
   * Gets headers object with Authorization header
   * @returns Headers object for HTTP requests
   */
  public getAuthHeaders(): Record<string, string> {
    return {
      Authorization: this.getAuthHeader()
    };
  }
}
