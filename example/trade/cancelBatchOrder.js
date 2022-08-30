const { BiboxSpotsClient } = require( "../../biboxSpotsClient" );
const apiKey = "";
const secretKey = "";
const client = new BiboxSpotsClient( apiKey, secretKey );

cancelBatchOrder = async () => {
    try {
        await client.cancelBatchOrder( [ '14482767162333325', '14481667651529881' ] );
    } catch ( e ) {
        console.log( e );
    }
};
cancelBatchOrder();
