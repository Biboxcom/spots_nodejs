const { BiboxSpotsClient  } = require( "../../biboxSpotsClient" );
const apiKey = "2aa4a99148c65c4dbaed3a9718c87f83fc5d333e";
const secretKey = "a05f00a59a1ffbf7e3a88b10f0e658e6a77ba474";
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


















