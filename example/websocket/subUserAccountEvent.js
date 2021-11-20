const { BiboxSpotsClient  } = require( "../../biboxSpotsClient" );
const apiKey = "your apiKey";
const secretKey = "your secretKey";
const client = new BiboxSpotsClient( apiKey, secretKey );

subscribeAccount = () => {
    client.subscribeAccount(  ( data ) => {
        console.log( data );
        // {
        //     BTC: { asset: 'BTC', available: '0.00039920', freeze: '0.00000000' }
        // }

    } );

};
subscribeAccount();


















