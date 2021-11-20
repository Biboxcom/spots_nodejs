const { BiboxSpotsClient  } = require( "../../biboxSpotsClient" );
const apiKey = "your apiKey";
const secretKey = "your secretKey";
const client = new BiboxSpotsClient( apiKey, secretKey );

subscribeFill = () => {
    client.subscribeFill(  ( data ) => {
        console.log( data );
        // []
    } );
};
subscribeFill();
