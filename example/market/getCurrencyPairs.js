const { BiboxSpotsClient } = require( "../../biboxSpotsClient" );
const client = new BiboxSpotsClient();

getCurrencyPairs = async () => {
    try {
        let spots = await client.getCurrencyPairs();
        console.log( spots );
        // [    {
        //         id: 337,
        //         symbol: 'IRIS_ETH',        // 交易对
        //         minOrderSize: '0.0001',    // 最小下单数量
        //         minOrderValue: '0.005'     // 最小下单金额
        //     },
        // ... 213 more items
        // ]

    } catch ( e ) {
        console.log( e );
    }
};
getCurrencyPairs();
