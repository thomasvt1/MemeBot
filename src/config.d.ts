export = config;

declare namespace config {

    interface configvalues {
        token: string,
        channels: string[]
        websocket: {
            enabled: boolean;
            url: string;
        },
        mysql: {
            host: string;
            port: number;
            user: string;
            password: string;
            database: string;
        },
        reddit: {
            clientId: string,
            clientSecret: string;
            refreshToken: string;
            userAgent: string;
        }
    }
}
