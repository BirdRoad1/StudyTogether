import {WebSocket} from 'ws';

export interface User {
    name: string;
    ws: WebSocket;
}