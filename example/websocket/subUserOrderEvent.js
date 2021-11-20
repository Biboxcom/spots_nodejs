const { BiboxSpotsClient  } = require( "../../biboxSpotsClient" );
const apiKey = "your apiKey";
const secretKey = "your secretKey";
const client = new BiboxSpotsClient( apiKey, secretKey );

subscribeOrder = () => {
    client.subscribeOrder(  ( data ) => {
        console.log( data );
        // []
    } );
};
subscribeOrder();
