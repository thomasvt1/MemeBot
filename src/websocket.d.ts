export = main;

declare namespace main {

    interface submdata {
        submid: string;
        upvotes: number;
        comments: number;
        timediff: number;
        username: string;
        investments?: number;
        highinvestments?: number;
    }
}
