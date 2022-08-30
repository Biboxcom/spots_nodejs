const { BiboxSpotsClient } = require( "../../biboxSpotsClient" );
const apiKey = "";
const secretKey = "";
const client = new BiboxSpotsClient( apiKey, secretKey );

cancelAllOrder = async () => {
    try {
        await client.cancelAllOrder( "BTC_USDT" );
    } catch ( e ) {
        console.log( e );
    }
};
cancelAllOrder();
