import { WSClient } from '@shared/ws-client.js';

export interface User {
    name: string;
    client: WSClient;
}