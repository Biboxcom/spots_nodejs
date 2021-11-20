
<h1 align="center">Welcome to Bibox Spots Client 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-v1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> Bibox平台现货Nodejs版本SDK

### 🏠 [Homepage](https://www.bibox.me/v2/exchange)

## Dependency

```sh
需要 node v14+
```

## Usage

```sh
// 如果出现网络问题,你可能需要代理或者重设client的相关地址参数

// 新建客户端对象 公开的api可以不传apiKey与secretKey
const { BiboxSpotsClient  } = require( "../../biboxFuturesClient" );
const apiKey = "Your apiKey";
const secretKey = "Your secretKey";
const client = new BiboxSpotsClient( apiKey, secretKey );
        
// 公开的api 获取kline
let res = await client.getCandlestick( "BTC_USDT", TimeInterval.DAILY, 10 );
console.log( res );

// 用户的api 转入或转出现货账户
await client.transferIn( "IRIS", 10 );
await client.transferOut( "IRIS", 10 );

// 用户的api 下单
let orderId = await client.placeLimitOrder( {
    symbol: "IRIS_USDT",
    quantity: 20,
    price: 0.0517,
    tradeSide: TradeSide.BID,
} );
console.log( orderId );

// 公开的订阅 订阅kline
client.subscribeCandlestick( "BTC_USD", TimeInterval.ONE_MINUTE, ( data ) => {
    console.log( "BTC_USDT", data );
} );

// 用户的订阅 用户资产数据
client.subscribeAccount(  ( data ) => {
    console.log( data );
} );

// 更多的可以参考测试用例
```

## Author

👤 **Biboxcom**

* Website: https://github.com/Biboxcom
* Github: [@Biboxcom](https://github.com/Biboxcom)

## Show your support

Give a ⭐️ if this project helped you!


