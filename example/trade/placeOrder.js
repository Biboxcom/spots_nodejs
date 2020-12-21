const { BiboxSpotsClient, TradeSide  } = require( "../../biboxSpotsClient" );
const apiKey = "2aa4a99148c65c4dbaed3a9718c87f83fc5d333e";
const secretKey = "a05f00a59a1ffbf7e3a88b10f0e658e6a77ba474";
const client = new BiboxSpotsClient( apiKey, secretKey );

placeOrder = async () => {
    try {
        let orderId = await client.placeLimitOrder( {
            symbol: "IRIS_USDT",
            quantity: 20,
            price: 0.0517,
            tradeSide: TradeSide.BID,
        } );
        console.log( orderId );

    }catch ( e ) {
        console.log( e );
    }
};
placeOrder();
