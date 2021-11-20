/*
 * Copyright (C) 2020, Bibox.com. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

const got = require( "got" );
const CryptoJS = require( "crypto-js" );
let events = require( "events" );
const emitter = new events.EventEmitter();
const WebSocket = require( 'ws' );
const zlib = require( 'zlib' );
// const { Worker, isMainThread, parentPort } = require( 'worker_threads' );
// const sleep = ( delay ) => new Promise( ( resolve ) => setTimeout( resolve, delay ) );
const defaultConfig = {
    apiKey: "",
    secretKey: "",
    restHost: "https://api.bibox.com",
    wssHost: "wss://npush.bibox360.com"
};

const MarketUrl = {
    CANDLESTICK: "/v3/mdata/kline",
    ORDER_BOOK: "/v3/mdata/depth",
    SPOT_LIST: "/v3/mdata/pairList",
    TRADE_LIMIT: "/v3.1/orderpending/tradeLimit",
    TICKER: "/v3/mdata/ticker",
    DEALS: "/v3/mdata/deals"
};

const PrivateUrl = {
    CANCEL_ORDER: "/v3.1/orderpending/cancelTrade",
    MAIN_ACCOUNT: "/v3.1/transfer/mainAssets",
    SPOT_ACCOUNT: "/v3.1/spot/account/assets",
    BILLS: "/v3.1/spot/account/bills",
    TRADES: "/v3.1/orderpending/orderDetail",
    TRADES_HISTORY: "/v3.1/orderpending/orderHistoryList",
    COIN_CONFIG: "/v3.1/transfer/coinConfig",
    GET_DEPOSIT_ADDR: "/v3.1/transfer/transferIn",
    DEPOSIT_ENTRIES: "/v3.1/transfer/transferInList",
    URL_ORDER_DETAIL: "/v3.1/orderpending/order",
    ORDER_PENDING_LIST: "/v3.1/orderpending/orderPendingList",
    ORDER_HISTORY_LIST: "/v3.1/orderpending/pendingHistoryList",
    URL_WITHDRAW_ENTRIES: "/v3.1/transfer/transferOutList",
    PLACE_ORDER: "/v3.1/orderpending/trade",
    WITHDRAW: "/v3.1/transfer/transferOut",
    TRANSFER_SPOT: "/v3/assets/transfer/spot"
};

const TimeInterval = Object.freeze( {
    ONE_MINUTE: "1min",
    THREE_MINUTES: "3min",
    FIVE_MINUTES: "5min",
    FIFTEEN_MINUTES: "15min",
    HALF_HOURLY: "30min",
    HOURLY: "1hour",
    TWO_HOURLY: "2hour",
    FOUR_HOURLY: "4hour",
    SIX_HOURLY: "6hour",
    TWELVE_HOURLY: "12hour",
    DAILY: "day",
    WEEKLY: "week"
} );

const TradeSide = Object.freeze( {
    BID: "BID",
    ASK: "ASK"
} );

const DepositStatus = Object.freeze( {
    ALL: "ALL",
    PENDING: "PENDING",
    SUCCESS: "SUCCESS",
    FAIL: "FAIL"
} );

const MarginMode = Object.freeze( {
    CROSS: "CROSS",
    ISOLATED: "ISOLATED"
} );

const OrderStatus = Object.freeze( {
    CREATED: "CREATED",
    PARTIAL_FILLED: "PARTIAL_FILLED",
    FILLED: "FILLED",
    PARTIAL_CANCELED: "PARTIAL_CANCELED",
    CANCELED: "CANCELED",
    REJECTED: "REJECTED"
} );

const BillType = Object.freeze( {
    TRANSFER_IN: "TRANSFER_IN",
    TRANSFER_OUT: "TRANSFER_OUT",
    BID: "BID",
    ASK: "ASK",
    UNDEFINED: "UNDEFINED",
} );

const ApiDepositStatus = Object.freeze( {
    ALL: 0,
    PENDING: 1,
    SUCCESS: 2,
    FAIL: 3,

    fromInteger: ( num ) => {
        switch ( num ) {
            case 0:
                return "ALL";
            case 1:
                return "PENDING";
            case 2:
                return "SUCCESS";
            case 3:
                return "FAIL";
        }
    }
} );

const ApiWithDrawEntryStatus = Object.freeze( {
    PENDING: 1,
    SUCCESS: 2,
    FAIL: 3,
    CANCEL: 4,

    fromInteger: ( num ) => {
        switch ( num ) {
            case 1:
                return "PENDING";
            case 2:
                return "SUCCESS";
            case 3:
                return "FAIL";
            case 4:
                return "CANCEL";
        }
    }
} );

const ApiOrderStatus = Object.freeze( {
    REJECTED: -1,
    CREATED: 1,
    PARTIAL_FILLED: 2,
    FILLED: 3,
    PARTIAL_CANCELED: 4,
    CANCELED: 5,
    WAIT_CANCEL: 6,

    fromInteger: ( num ) => {
        switch ( num ) {
            case -1:
                return "REJECTED";
            case 1:
                return "CREATED";
            case 2:
                return "PARTIAL_FILLED";
            case 3:
                return "FILLED";
            case 4:
                return "PARTIAL_CANCELED";
            case 5:
                return "CANCELED";
            case 6:
                return "WAIT_CANCEL";
        }
    }
} );

const ApiBillType = Object.freeze( {
    TRANSFER_IN: 130,
    TRANSFER_OUT: 131,
    BID: 5,
    ASK: 3,
    UNDEFINED: -1,

    fromInteger: ( num ) => {
        switch ( num ) {
            case 130:
                return "TRANSFER_IN";
            case 131:
                return "TRANSFER_OUT";
            case 5:
                return "BID";
            case 3:
                return "ASK";
            case -1:
                return "UNDEFINED";
        }
    }
} );

const ApiTradeSide = Object.freeze( {
    BID: 1,
    ASK: 2,

    fromInteger: ( num ) => {
        switch ( num ) {
            case 1:
                return "BID";
            case 2:
                return "ASK";
        }
    }
} );

class BiboxSpotsClientBase {

    constructor( apiKey, secretKey ) {
        this._apiKey = apiKey || defaultConfig.apiKey;
        this._secretKey = secretKey || defaultConfig.secretKey;
        this._restHost = defaultConfig.restHost;
        this._wssHost = defaultConfig.wssHost;

        this._subscriptions = {};
        this._wss = null;
        this._pingTimeout = null;
        this._wssOpened = false;
    }

    setRestHost = ( restHost ) => {
        this._restHost = restHost;
    }

    setWssHost = ( wssHost ) => {
        this._wssHost = wssHost;
    }

    _onWebSocketOpen = () => {
        this._wssOpened = true;
        emitter.on( "sub_channel", ( channel ) => {
            if ( channel && this._subscriptions[channel] ) {
                this._wss.send( this._subscriptions[channel] );
                return;
            }
            for ( const sub of Object.values( this._subscriptions ) ) {
                this._wss.send( sub.toString() );
            }
        } );

        emitter.on( "unsub_channel", ( channel ) => {
            if ( channel && this._subscriptions[channel] ) {
                this._wss.send( JSON.stringify( {
                    "channel": this._subscriptions.getChannel(),
                    "event": "removeChannel"
                } ) );
                delete this._subscriptions[channel];
            }
        } );

        emitter.on( "unsub_private_channel", ( channel ) => {
            this._wss.send( JSON.stringify( {
                "unsub": this._subscriptions.getChannel(),
            } ) );
            for ( let key of Object.keys( this._subscriptions ) ) {
                if ( key.indexOf( channel ) !== -1 ) {
                    delete this._subscriptions[key];
                }
            }
        } );
    }

    _subscribe = ( sub ) => {
        let channel = sub.getChannel();
        if ( !this._subscriptions.hasOwnProperty( channel ) ) {
            this._subscriptions[channel] = sub;
        }
        if ( this._wssOpened ) {
            emitter.emit( "sub_channel", channel );
        }
        this._initWss();
    }

    _unsubscribe = ( channel ) => {
        if ( this._wssOpened ) {
            emitter.emit( "unsub_channel", channel );
        }
    }
    _unsubscribeAllPrivateSubscriptions = () => {
        if ( this._wssOpened ) {
            emitter.emit( "unsub_private_channel", PrivateSubscription.CHANNEL_PREFIX );
        }
    }

    _heartbeat = () => {
        if ( this._pingTimeout ) {
            clearTimeout( this._pingTimeout );
        }

        this._pingTimeout = setTimeout( () => {
            this._wss.terminate();
            this._wss = null;
            this._initWss();
        }, 70000 );
    };

    _loopPing = () => {
        if ( this._keepLive ) {
            clearTimeout( this._keepLive );
        }

        this._keepLive = setTimeout( () => {
            this._wss.ping( new Date().getTime() );
            this._loopPing();
        }, 20000 );
    };

    _initWss = () => {
        if ( !this._wss ) {
            this._wss = new WebSocket( this._wssHost );
            this._wss.on( "open", () => {
                this._onWebSocketOpen();
                emitter.emit( "sub_channel" );
                this._loopPing();
            } );

            this._wss.on( "close", () => {
                clearTimeout( this._pingTimeout );
            } );

            this._wss.on( "error", ( err ) => {
                console.log( "error", err );
            } );

            // eslint-disable-next-line no-unused-vars
            this._wss.on( "ping", ( message ) => {
                // console.log( "ping", message.toString() );
                this._heartbeat();
            } );

            // eslint-disable-next-line no-unused-vars
            this._wss.on( "pong", ( message ) => {
                // console.log( "pong", message.toString() );
            } );

            this._wss.on( "message", ( message ) => {
                message = this._decodeBytes( message );
                if ( this._isObj( message ) ) {
                    let data = JSON.parse( message );
                    let channel = data.topic;
                    if ( !channel ) {
                        return;
                    }
                    if ( PrivateSubscription.CHANNEL_PREFIX === channel ) {
                        let pdata = data.d;
                        for ( let psub of Object.values( this._subscriptions ) ) {
                            if ( psub.belong( pdata ) ) {
                                psub.onMessage( pdata[psub.getDataName()] );
                                break;
                            }

                        }
                        return;
                    }
                    
                    let sub = this._subscriptions[channel];
                    if ( sub ) {
                        sub.onMessage( data.d );
                    }

                }
            } );
        }
    };

    _decodeBytes = ( array ) => {
        let zipFlag = array[0];
        let offset = 1;
        let length = array.length - offset;
        if ( !zipFlag ) {
            return array.toString( 'utf-8', offset, length );
        }else if ( zipFlag === 1 ) {
            return this._ungZip( array, offset );
        }else {
            let unknow = array.toString( 'utf-8', 0, length );
            if ( unknow.includes( "error" ) ) {
                console.log( unknow );
            }
        }
        return '';
    }
    _ungZip = ( array, offset ) => {
        array = array.slice( offset );
        return zlib.gunzipSync( array ).toString();
    }
    _getProxy = async ( path, param ) => {
        let res = await this._sendGet( path, param );
        this._checkState( res );
        return res;
    };

    _postProxy = async ( path, param ) => {
        let res = await this._sendPost( path, param );
        this._checkState( res );
        return res;
    };

    _checkState = ( res ) => {
        if ( res.hasOwnProperty( "state" ) && res.state !== 0 )
            throw `Error (state:${ res.state }, message:${ res.msg })`;
    };

    _sendGet = async ( path, param ) => {
        try {
            return await got( this._url( path ), {
                searchParams: new URLSearchParams( param )
            } ).json();
        } catch ( error ) {
            console.log( error );
            throw error;
        }
    };

    _sendPost = async ( path, param ) => {
        try {
            let timestamp = Date.now();
            let strParam = JSON.stringify( param );
            let strToSign = '' + timestamp + strParam;
            let sign = this._buildSign( strToSign );

            return await got.post( this._url( path ), {
                json: param,
                headers: {
                    "bibox-api-key": this._apiKey,
                    "bibox-api-sign": sign,
                    "bibox-timestamp": timestamp
                }
            } ).json();
        } catch ( error ) {
            console.log( error );
            throw error;
        }
    };

    _url = ( path ) => {
        return this._restHost + path;
    };

    _buildSign = ( strToSign ) => {
        return CryptoJS.HmacMD5( strToSign, this._secretKey ).toString();
    };

    _buildSubSign = () => {
        let signStr = `{"apikey":"${ this._apiKey }","sub":"${ PrivateSubscription.CHANNEL_PREFIX }"}`;
        return CryptoJS.HmacMD5( signStr, this._secretKey ).toString();
    };

    _isArrMsg = ( str ) => str.startsWith( "[" );
    _isObj = ( str ) => str.startsWith( "{" );

}

class BiboxSpotsClient extends BiboxSpotsClientBase {

    constructor( apiKey, secretKey ) {
        super( apiKey, secretKey );
    }

    /**
     * 获取kline
     * @param  symbol 币种名称
     * @param  interval 时间周期
     * @param  limit 条目限制
     */
    getCandlestick = async ( symbol, interval, limit ) => {
        let res = await this._getProxy( MarketUrl.CANDLESTICK, {
            "pair": symbol,
            "period": interval,
            "size": limit || 100
        } );
        return JsonUtil.candlestickWrapper( res.result );
    };

    /**
     * 获取深度
     * @param  symbol 交易对名称
     * @param  limit  条目限制
     */
    getOrderBook = async ( symbol, limit ) => {
        let res = await this._getProxy( MarketUrl.ORDER_BOOK, {
            "pair": symbol,
            "size": Number( limit ) || 200
        } );
        return JsonUtil.orderBookWrapper( res.result );
    };

    /**
     * 获取交易对
     */
    getCurrencyPairs = async () => {
        let [ spots, limit ] = await Promise.all( [
            this._getProxy( MarketUrl.SPOT_LIST, {} ),
            this._getProxy( MarketUrl.TRADE_LIMIT, {} )
        ] );
        return JsonUtil.currencyPairsWrapper( spots.result, limit.result );
    }

    /**
     * 获取ticker
     * @param  symbol 交易对
     */
    getTicker = async ( symbol ) => {
        let res = await this._getProxy( MarketUrl.TICKER, {
            "pair": symbol,
        } );
        return JsonUtil.tickerWrapper( res.result );
    }

    /**
     * 获取公开成交记录
     * @param symbol 交易对
     * @param limit  数量限制
     */
    getTrades = async ( symbol, limit ) => {
        let res = await this._getProxy( MarketUrl.DEALS, {
            "pair": symbol,
            "size": Number( limit ) || 200
        } );
        return JsonUtil.tradeWrapper( res.result );
    }

    /**
     * 从钱包转进现货
     * @param  asset 账户名称
     * @param  amount 金额
     */
    transferIn = async ( asset, amount ) => {
        await this._postProxy( PrivateUrl.TRANSFER_SPOT, {
            "amount": String( amount ),
            "symbol": asset,
            "type": 0
        } );
    }

    /**
     * 从现货转进钱包
     * @param  asset 账户名称
     * @param  amount 金额
     */
    transferOut = async ( asset, amount ) => {
        await this._postProxy( PrivateUrl.TRANSFER_SPOT, {
            "amount": String( amount ),
            "symbol": asset,
            "type": 1
        } );
    }

    /**
     * 提现
     * @param symbol 提现币种
     * @param amount 提现数量
     * @param address   提现地址
     * @param memo   memo
     */
    withdraw = async ( symbol, amount, address, memo ) => {
        await this._postProxy( PrivateUrl.WITHDRAW, {
            "coin_symbol": symbol,
            "amount": Number( amount ),
            "addr": address,
            "memo": memo || undefined
        } );
    }

    /**
     * 提交委限价托单
     * @param symbol        交易对名称
     * @param quantity      下单数量
     * @param price         下单价格
     * @param tradeSide     交易方向
     */
    placeLimitOrder = async ( { symbol, quantity, price, tradeSide } = {} ) => {
        let res = await this._postProxy( PrivateUrl.PLACE_ORDER, {
            "account_type": 0,
            "pair": symbol,
            "amount": Number( quantity ),
            "price": Number( price ),
            "order_side": ApiTradeSide[tradeSide],
            "order_type": 2,
        } );
        return res.result;
    }

    /**
     * 撤销委托单
     * @param orderId 订单id
     */
    cancelOrder = async ( orderId ) => {
        await this._postProxy( PrivateUrl.CANCEL_ORDER, {
            "orders_id": orderId.toString(),
        } );
    }

    /**
     * 查询钱包账户资产
     */
    getMainAccounts = async () => {
        let res = await this._postProxy( PrivateUrl.MAIN_ACCOUNT, {
            "select": 1
        } );
        return Object.values( JsonUtil.accountsWrapper( res.result ) );
    }

    /**
     * 查询钱包账户资产
     * @param symbol 币种
     */
    getMainAccount = async ( symbol ) => {
        let res = await this._postProxy( PrivateUrl.MAIN_ACCOUNT, {
            "select": 1
        } );
        return JsonUtil.accountsWrapper( res.result )[symbol];
    }

    /**
     * 查询现货账户资产
     */
    getSpotAccounts = async () => {
        let res = await this._postProxy( PrivateUrl.SPOT_ACCOUNT, {
            "select": 1
        } );
        return Object.values( JsonUtil.accountsWrapper( res.result ) );
    }

    /**
     * 查询现货账户资产
     * @param symbol 币种
     */
    getSpotAccount = async ( symbol ) => {
        let res = await this._postProxy( PrivateUrl.SPOT_ACCOUNT, {
            "select": 1
        } );
        return JsonUtil.accountsWrapper( res.result )[symbol];
    }

    /**
     * 获取全部币种的配置
     */
    getAssetInfos = async () => {
        let res = await this._postProxy( PrivateUrl.COIN_CONFIG, {} );
        return JsonUtil.assetInfosWrapper( res.result );
    }

    /**
     * 获取指定的币种的配置
     * @param symbol 币种
     */
    getAssetInfo = async ( symbol ) => {
        let res = await this._postProxy( PrivateUrl.COIN_CONFIG, {
            "coin_symbol": symbol
        } );
        return JsonUtil.assetInfosWrapper( res.result )[0];
    }

    /**
     * 获取指定币种充值地址
     * @param symbol 币种
     */
    getDepositAddress = async ( symbol ) => {
        let res = await this._postProxy( PrivateUrl.GET_DEPOSIT_ADDR, {
            "coin_symbol": symbol
        } );
        return res.result;
    }

    /**
     * 获取充值记录
     * @param depositStatus  充值状态
     * @param symbol  币种
     * @param page    页数
     * @param size    每页数量
     */
    getDepositEntries = async ( depositStatus, symbol, page, size ) => {
        let res = await this._postProxy( PrivateUrl.DEPOSIT_ENTRIES, {
            "coin_symbol": symbol || undefined,
            "page": page || 1,
            "size": size || 10,
            "filter_type": ApiDepositStatus[depositStatus] || undefined
        } );
        return JsonUtil.depositEntriesWrapper( res.result );
    }

    /**
     * 获取提现记录
     * @param symbol  币种
     * @param page    页数
     * @param size    每页数量
     */
    getWithdrawEntries = async ( symbol, page, size ) => {
        let res = await this._postProxy( PrivateUrl.URL_WITHDRAW_ENTRIES, {
            "coin_symbol": symbol || undefined,
            "page": page || 1,
            "size": size || 10,
        } );
        return JsonUtil.withdrawEntriesWrapper( res.result );
    }

    /**
     * 获取现货的账单
     * @param start     开始时间
     * @param end       结束时间
     * @param billType  类型
     * @param page      页码
     * @param size      条目数
     */
    getBills = async ( start, end, billType, page, size ) => {
        let res = await this._postProxy( PrivateUrl.BILLS, {
            "type": ApiBillType[billType],
            "begin_time": start || undefined,
            "end_time": end || undefined,
            "page": Number( page ) || 1,
            "size": Number( size ) || 10,
            "account_type": 1,
        } );
        return JsonUtil.billsWrapper( res.result );
    }

    /**
     * 获取交易详情
     * @param base        交易币种
     * @param quote       计价币种
     * @param tradeSide   交易方向
     * @param page        页码
     * @param size        条目数
     */
    getFills = async ( base, quote, tradeSide, page, size ) => {
        let res = await this._postProxy( PrivateUrl.TRADES_HISTORY, {
            "account_type": 0,
            "page": Number( page ) || 1,
            "size": Number( size ) || 10,
            "coin_symbol": base || undefined,
            "currency_symbol": quote || undefined,
            "order_side": ApiTradeSide[tradeSide]
        } );
        return JsonUtil.fillsWrapper( res.result );
    }

    /**
     * 根据订单id获取交易详情
     * @param orderId  订单id
     */
    getFillsById = async ( orderId ) => {
        let res = await this._postProxy( PrivateUrl.TRADES, {
            "account_type": 0,
            "id": orderId.toString()
        } );
        return JsonUtil.fillsByIdWrapper( res.result );
    }

    /**
     * 获取委托单
     * @param id 委托id或者用户自定义id
     */
    getOrder = async ( id ) => {
        let res = await this._postProxy( PrivateUrl.URL_ORDER_DETAIL, {
            "account_type": 0,
            "id": id.toString(),
        } );
        return JsonUtil.orderWrapper( res.result );
    };

    /**
     * 获取当前委托单
     * @param base         交易币种
     * @param quote        计价币种
     * @param tradeSide    交易方向
     * @param page         页码
     * @param size         条目数
     */
    getOpenOrders = async ( base, quote, tradeSide, page, size ) => {
        let res = await this._postProxy( PrivateUrl.ORDER_PENDING_LIST, {
            "account_type": 0,
            "page": page || 1,
            "size": size || 10,
            "coin_symbol": base || undefined,
            "currency_symbol": quote || undefined,
            "oder_side": ApiTradeSide[tradeSide]
        } );
        return JsonUtil.ordersWrapper( res.result );
    };

    /**
     * 获取历史委托单
     * @param base         交易币种
     * @param quote        计价币种
     * @param tradeSide    交易方向
     * @param page         页码
     * @param size         条目数
     */
    getClosedOrders = async ( base, quote, tradeSide, page, size ) => {
        let res = await this._postProxy( PrivateUrl.ORDER_HISTORY_LIST, {
            "account_type": 0,
            "page": page || 1,
            "size": size || 10,
            "coin_symbol": base || undefined,
            "currency_symbol": quote || undefined,
            "oder_side": ApiTradeSide[tradeSide]
        } );
        return JsonUtil.ordersWrapper( res.result );
    };

    /**
     * 订阅kline
     * @param {string} symbol 交易对名称
     * @param {string} interval 时间周期
     * @param listener
     */
    subscribeCandlestick = ( symbol, interval, listener ) => {
        this._subscribe( new CandlestickSubscription( symbol, interval, listener ) );
    };

    /**
     * 取消订阅kline
     * @param {string} symbol 交易对名称
     * @param {string} interval 时间周期
     */
    unsubscribeCandlestick = ( symbol, interval ) => {
        this._unsubscribe( CandlestickSubscription.buildChannelName( symbol, interval ) );
    };

    /**
     * 订阅深度
     * @param {string} symbol 交易对名称
     * @param listener
     */
    subscribeOrderBook = ( symbol, listener ) => {
        this._subscribe( new OrderBookSubscription( symbol, listener ) );
    };

    /**
     * 取消订阅深度
     * @param {string} symbol 交易对名称
     */
    unsubscribeOrderBook = ( symbol ) => {
        this._unsubscribe( OrderBookSubscription.buildChannelName( symbol ) );
    };

    /**
     * 订阅市场成交记录
     * @param {string} symbol 交易对名称
     * @param listener
     */
    subscribeTrade = ( symbol, listener ) => {
        this._subscribe( new TradeSubscription( symbol, listener ) );
    };

    /**
     * 取消订阅深度
     * @param {string} symbol 交易对名称
     */
    unsubscribeTrade = ( symbol ) => {
        this._unsubscribe( TradeSubscription.buildChannelName( symbol ) );
    };

    /**
     * 订阅指定的Ticker数据
     * @param {string} symbol 交易对名称
     * @param listener
     */
    subscribeTicker = ( symbol, listener ) => {
        this._subscribe( new TickerSubscription( symbol, listener ) );
    };

    /**
     * 取消订阅指定交易对的Ticker数据
     * @param {string} symbol 交易对名称
     */
    unsubscribeTicker = ( symbol ) => {
        this._unsubscribe( TickerSubscription.buildChannelName( symbol ) );
    };

    /**
     * 订阅资产账户变化信息
     */
    subscribeAccount = ( listener ) => {
        this._subscribe( new AccountSubscription( this, listener ) );
    };

    /**
     * 订阅与委托相关的信息
     */
    subscribeOrder = ( listener ) => {
        this._subscribe( new OrderSubscription( this, listener ) );
    };

    /**
     * 订阅用户数据解析成交明细
     */
    subscribeFill = ( listener ) => {
        this._subscribe( new FillSubscription( this, listener ) );
    };

    /**
     * 取消全部对用户数据的订阅
     */
    unsubscribePrivateChannel = () => {
        this._unsubscribeAllPrivateSubscriptions();
    };

}

class Subscription {

    constructor( listener ) {
        this._listener = listener;
        this._notified = false;
    }

    _decode = ( data ) => {
        console.log( data );
        throw "Not implemented";
    };

    _onData = ( data ) => {
        console.log( data );
        throw "Not implemented";
    };

    _getData = () => {
        throw "Not implemented";
    };

    onMessage = ( msg ) => {
        let obj = this._decode( msg );
        this._onData( obj );
        this._notifyUpdate();
    };

    _notifyUpdate = () => {
        if ( this._notified ) return;
        this._notified = true;
        setImmediate( () => {
            this._listener( this._getData() );
            this._notified = false;
        } );
    };

}

class CandlestickSubscription extends Subscription {

    constructor( symbol, interval, listener ) {
        super( listener );
        this._symbol = symbol;
        this._interval = interval;
        this._data = [];
    }

    _decode = ( data ) => {
        return JsonUtil.candlestickEventWrapper( data );
    };

    _onData = ( data ) => {
        this._data.push( ...data );
    };

    _getData = () => {
        let data = JSON.parse( JSON.stringify( this._data ) );
        this._data = [];
        return data;
    };

    static buildChannelName = ( symbol, interval ) => {
        return `${ symbol }_kline_${ interval }`;
    };

    getChannel = () => {
        return CandlestickSubscription.buildChannelName( this._symbol, this._interval );
    };

    toString() {
        return JSON.stringify( {
            sub: this.getChannel(),
        } );
    }

}

class OrderBookSubscription extends Subscription {

    constructor( symbol, listener ) {
        super( listener );
        this._symbol = symbol;
        this._data = {};
        this._asks = {};
        this._bids = {};
    }

    _decode = ( obj ) => {
        if ( !obj.hasOwnProperty( "add" ) ) {
            this._data = JsonUtil.orderBookEventWrapper( obj );
            this._asks = this._data.asks.reduce( ( res, item ) => {
                res[item.price] = item;
                return res;
            }, {} );
            this._bids = this._data.bids.reduce( ( res, item ) => {
                res[item.price] = item;
                return res;
            }, {} );
        } else {
            if ( obj.add.asks ) {
                obj.add.asks.forEach( item => {
                    this._asks[item.price] = { price: item[1], amount: item[0] };
                } );
            }
            if ( obj.add.bids ) {
                obj.add.bids.forEach( item => {
                    this._bids[item.price] = { price: item[1], amount: item[0] };
                } );
            }
            if ( obj.del.asks ) {
                obj.del.asks.forEach( item => {
                    delete this._asks[item[1]];
                } );
            }
            if ( obj.del.bids ) {
                obj.del.bids.forEach( item => {
                    delete this._bids[item[1]];
                } );
            }
            this._data.updateTime = obj.ut;

            this._data.asks = Object.values( this._asks ).sort( ( f, b ) => f.price - b.price );
            this._data.bids = Object.values( this._bids ).sort( ( f, b ) => b.price - f.price );
        }

        return this._data;
    };

    _onData = () => {
        // do nothing
    };

    _getData = () => {
        return JSON.parse( JSON.stringify( this._data ) );
    };

    static buildChannelName = ( symbol ) => {
        return `${ symbol }_depth`;
    };

    getChannel = () => {
        return OrderBookSubscription.buildChannelName( this._symbol );
    };

    toString() {
        return JSON.stringify( {
            sub: this.getChannel(),
        } );
    }

}

class TradeSubscription extends Subscription {

    constructor( symbol, listener ) {
        super( listener );
        this._symbol = symbol;
        this._data = [];
    }

    _decode = ( obj ) => {
        if ( obj.constructor === Array ) {
            return JsonUtil.tradeEventWrapper( obj );
        }else {
            if ( obj.d && obj.d[0] ) {
                return JsonUtil.tradeEventWrapper( obj.d[0], obj.pair );
            }
        }
        return [];
    };

    _onData = ( data ) => {
        this._data.push( ...data );
    };

    _getData = () => {
        let data = JSON.parse( JSON.stringify( this._data ) );
        this._data = [];
        return data;
    };

    static buildChannelName = ( symbol ) => {
        return `${ symbol }_deals`;
    };

    getChannel = () => {
        return TradeSubscription.buildChannelName( this._symbol );
    };

    toString() {
        return JSON.stringify( {
            sub: this.getChannel(),
        } );
    }

}

class TickerSubscription extends Subscription {

    constructor( symbol, listener ) {
        super( listener );
        this._symbol = symbol;
        this._data = {};
    }

    _decode = ( obj ) => {
        return JsonUtil.tickerEventWrapper( obj );
    };

    _onData = ( data ) => {
        this._data = data;
    };

    _getData = () => {
        return this._data;
    };

    static buildChannelName = ( symbol ) => {
        return `${ symbol }_ticker`;
    };

    getChannel = () => {
        return TickerSubscription.buildChannelName( this._symbol );
    };

    toString() {
        return JSON.stringify( {
            sub: this.getChannel(),
        } );
    }

}

class PrivateSubscription extends Subscription {

    static CHANNEL_PREFIX = "ALL_ALL_login"

    constructor( client, listener ) {
        super( listener );
        this._client = client;
    }

    belong = () => {
    }

    getDataName = () => {
    };

    getChannel = () => {
        return PrivateSubscription.CHANNEL_PREFIX + this.getDataName();
    };

    toString() {
        return JSON.stringify( {
            "apikey": this._client._apiKey,
            "sub": PrivateSubscription.CHANNEL_PREFIX,
            "sign": this._client._buildSubSign()
        } );
    }

}

class AccountSubscription extends PrivateSubscription {

    constructor( client, listener ) {
        super( client, listener );
        this._data = {};
    }

    _decode = ( obj ) => {
        return JsonUtil.accountEventWrapper( obj );
    };

    _onData = ( data ) => {
        data.forEach( item => {
            this._data[item.asset] = item;
        } );
    };

    _getData = () => {
        let data = JSON.parse( JSON.stringify( this._data ) );
        this._data = {};
        return data;
    };

    getDataName = () => {
        return "assets";
    };

    belong = ( obj ) => {
        if ( obj.hasOwnProperty( this.getDataName() ) ) {
            return obj[this.getDataName()].hasOwnProperty( "normal" );
        }
        return false;
    }

}

class FillSubscription extends PrivateSubscription {

    constructor( client, listener ) {
        super( client, listener );
        this._data = [];
    }

    _decode = ( obj ) => {
        return JsonUtil.fillEventWrapper( obj );
    };

    _onData = ( data ) => {
        this._data.push( data );
    };

    _getData = () => {
        let data = JSON.parse( JSON.stringify( this._data ) );
        this._data = [];
        return data;
    };

    getDataName = () => {
        return "history";
    };

    belong = ( obj ) => {
        if ( obj.hasOwnProperty( this.getDataName() ) ) {
            return obj[this.getDataName()].at === 0;
        }
        return false;
    }

}

class OrderSubscription extends PrivateSubscription {

    constructor( client, listener ) {
        super( client, listener );
        this._data = {};
    }

    _decode = ( obj ) => {
        return JsonUtil.orderEventWrapper( obj );
    };

    _onData = ( data ) => {
        this._data[data.orderId] = data;
    };

    _getData = () => {
        let data = JSON.parse( JSON.stringify( this._data ) );
        this._data = {};
        return data;
    };

    getDataName = () => {
        return "orderpending";
    };

    belong = ( obj ) => {
        if ( obj.hasOwnProperty( this.getDataName() ) ) {
            return obj[this.getDataName()].at === 0;
        }
        return false;
    }

}

class JsonUtil {

    static unzip = ( objzip ) => {
        let buf = zlib.unzipSync( Buffer.from( objzip, "base64" ) ).toString();
        return JSON.parse( buf );
    };

    static candlestickEventWrapper = ( obj ) => {
        if ( obj.length > 1 ) {
            let item = obj[1];
            return [ {
                time: item[0],
                open: item[1],
                high: item[2],
                low: item[3],
                close: item[4],
                volume: item[5]
            } ];
            
        }
        return [];
    };

    static candlestickWrapper = ( obj ) => {
        return obj.map( item => {
            return {
                time: item.time,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.vol
            };
        } );
    };

    static orderBookEventWrapper = ( obj ) => {
        let json = {
            symbol: obj.pair,
            updateTime: obj.ut,
            asks: [],
            bids: []
        };
        json.asks = obj.asks.map( item => {
            return {
                price: item[1],
                amount: item[0],
            };
        } );
        json.bids = obj.bids.map( item => {
            return {
                price: item[1],
                amount: item[0],
            };
        } );
        return json;
    };

    static orderBookWrapper = ( obj ) => {
        let json = {
            symbol: obj.pair,
            updateTime: obj.update_time,
            asks: [],
            bids: []
        };
        json.asks = obj.asks.map( item => {
            return {
                price: item.price,
                amount: item.volume,
            };
        } );
        json.bids = obj.bids.map( item => {
            return {
                price: item.price,
                amount: item.volume,
            };
        } );
        return json;
    };

    static marketPriceWrapper = ( obj ) => {
        return obj.map( item => {
            return {
                time: item.time,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
            };
        } );
    };

    static currencyPairsWrapper = ( spots, limit ) => {
        return spots.map( item => {
            let quote = item.pair.split( "_" )[1];
            return {
                id: item.id,
                symbol: item.pair,
                minOrderSize: limit.min_trade_amount.default,
                minOrderValue: limit.min_trade_money[quote] || 0
            };
        } );
    };

    static accountsWrapper = ( obj ) => {
        return obj.assets_list.reduce( ( x, item ) => {
            x[item.coin_symbol] = {
                asset: item.coin_symbol,
                available: item.balance,
                freeze: item.freeze
            };
            return x;
        }, {} );
    };

    static assetInfosWrapper = ( obj ) => {
        return obj.map( item => {
            return {
                symbol: item.coin_symbol,
                precision: item.original_decimals,
                depositEnabled: !!item.enable_deposit,
                withdrawEnabled: !!item.enable_withdraw,
                withdrawalFee: item.withdraw_fee,
                minWithdraw: item.withdraw_min
            };
        } );
    };

    static depositEntriesWrapper = ( obj ) => {
        return {
            count: obj.count,
            page: obj.page,
            items: obj.items.map( item => {
                return {
                    symbol: item.coin_symbol,
                    address: item.to_address,
                    amount: item.amount,
                    confirmations: item.confirmCount,
                    time: item.createdAt,
                    status: ApiDepositStatus.fromInteger( item.status )
                };
            } )
        };
    };

    static withdrawEntriesWrapper = ( obj ) => {
        return {
            count: obj.count,
            page: obj.page,
            items: obj.items.map( item => {
                return {
                    symbol: item.coin_symbol,
                    address: item.to_address,
                    amount: item.amount,
                    fee: item.fee,
                    time: item.createdAt,
                    status: ApiWithDrawEntryStatus.fromInteger( item.status ),
                    memo: item.memo
                };
            } )
        };
    };

    static billsWrapper = ( obj ) => {
        return {
            count: obj.count,
            page: obj.page,
            items: obj.items.map( item => {
                return {
                    symbol: item.symbol,
                    time: new Date( item.createdAt ).getTime(),
                    change: item.change_amount,
                    result: item.result_amount,
                    type: ApiBillType.fromInteger( item.bill_type )
                };
            } )
        };
    };

    static fillsWrapper = ( obj ) => {
        return {
            count: obj.count,
            page: obj.page,
            items: obj.items.map( item => {
                return this.fillWrapper( item );
            } )
        };
    };

    static fillsByIdWrapper = ( obj ) => {
        return obj.orderList.map( item => {
            return this.fillWrapper( item );
        } );
    };

    static fillWrapper = ( item ) => {
        return {
            id: item.id,
            orderId: item.relay_id,
            symbol: item.coin_symbol + "_" + item.currency_symbol,
            tradeSide: ApiTradeSide.fromInteger( item.order_side ),
            price: item.price,
            quantity: item.amount,
            isMaker: !!item.is_maker,
            time: item.createdAt,
            fee: {
                value: item.fee,
                symbol: item.fee_symbol,
                payInBIX: !!item.pay_bix,
            },
        };
    }

    static orderWrapper = ( obj ) => {
        return {
            side: ApiTradeSide.fromInteger( obj.order_side ),
            quantity: obj.amount,
            price: obj.price,
            createTime: obj.createdAt,
            executedQty: obj.deal_amount,
            orderId: obj.id,
            status: ApiOrderStatus.fromInteger( obj.status ),
            symbol: obj.coin_symbol + "_" + obj.currency_symbol
        };
    };

    static ordersWrapper = ( obj ) => {
        return {
            count: obj.count,
            page: obj.page,
            items: obj.items.map( item => {
                return this.orderWrapper( item );
            } )
        };
    };

    static tradeEventWrapper = ( item, pair ) => {
        if ( pair ) {
            return [ {
                symbol: pair,
                side: ApiTradeSide.fromInteger( item[2] ),
                price: item[0],
                quantity: item[1],
                time: item[3]
            } ];
        }
        
        return [ {
            symbol: item[0],
            side: ApiTradeSide.fromInteger( item[3] ),
            price: item[1],
            quantity: item[2],
            time: item[4]
        } ];
        
    };


    static tradeWrapper = ( obj ) => {
        return obj.map( item => {
            return {
                symbol: item.pair,
                side: ApiTradeSide.fromInteger( item.side ),
                price: item.price,
                quantity: item.amount,
                time: item.time
            };
        } );
    };

    static tickerEventWrapper = ( obj ) => {
        return {
            symbol: obj[0],
            change: obj[11],
            time: obj[12],
            volume: obj[10],
            price: obj[1],
            priceInCNY: obj[3],
            priceInUSD: obj[2],
            high: obj[4],
            low: obj[5],
            bestAskPrice: obj[8],
            bestAskQty: obj[9],
            bestBidPrice: obj[6],
            bestBidQty: obj[7]
        };
    };

    static tickerWrapper = ( obj ) => {
        return {
            symbol: obj.pair,
            change: obj.percent,
            time: obj.timestamp,
            volume: obj.vol,
            price: obj.last,
            priceInCNY: obj.base_last_cny,
            priceInUSD: obj.last_usd,
            high: obj.high,
            low: obj.low,
            bestAskPrice: obj.sell,
            bestAskQty: obj.sell_amount,
            bestBidPrice: obj.buy,
            bestBidQty: obj.buy_amount
        };
    };

    static fillEventWrapper = ( item ) => {
        return {
            id: item.id,
            orderId: item.rid,
            symbol: item.bs + "_" + item.qs,
            tradeSide: ApiTradeSide.fromInteger( item.os ),
            price: item.dp,
            quantity: item.da,
            isMaker: !!item.im,
            time: item.ct,
            fee: {
                value: item.fee,
            },
        };
    };

    static accountEventWrapper = ( obj ) => {
        let data = obj.normal;
        return Object.keys( data ).map( key => {
            return {
                asset: key,
                available: data[key].balance,
                freeze: data[key].freeze
            };
        } );
    };

    static orderEventWrapper = ( obj ) => {
        return {
            side: ApiTradeSide.fromInteger( obj.os ),
            quantity: obj.auth,
            price: obj.p,
            createTime: obj.ct,
            executedQty: obj.da,
            dealPrice:obj.dp,
            clientOrderId:obj.cid,
            orderId: obj.id,
            status: ApiOrderStatus.fromInteger( obj.s ),
            symbol: obj.bs + "_" + obj.qs
        };
    };

}

module.exports = {
    BiboxSpotsClient, TimeInterval, TradeSide, MarginMode,
    OrderStatus, BillType, DepositStatus
};
