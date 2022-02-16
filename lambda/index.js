/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const axios = require('axios').default;
// const currencyConverter = require('./currency')
const ngRokDomain = 'https://fd00-103-78-16-93.ngrok.io';
const resLimit = 3;
const apl = {
    bgImage: "https://www.nicepng.com/png/full/106-1062903_jpg-transparent-download-light-blue-fade-for-roxashl.png",
    logoUrl: "https://www.static-src.com/frontend/static/img/logo-blibli-white.f8255fc.svg"
}
const hotelPayload = {
    "checkIn": "2021-12-17",
    "checkOut": "2021-12-18",
    "adults": 1,
    "children": 0,
    "rooms": 1,
    "page": 0,
    "size": 20,
    "childrenAges": [],
    "type": "province",
    "query": "51",
    "locationPath": null,
    "name": null,
    "aggregation": true,
    "location": null,
    "parentLocation": null,
    "id": "51",
    "locationName": "Indonesia",
    "path": "/province/jakarta-raya-indonesia/51",
    "sortBy": null,
    "provinces": null,
    "regencies": null,
    "districts": null,
    "pointOfInterests": null,
    "accommodations": null,
    "starRatings": null,
    "facilities": null,
    "priceRange": null,
    "version": "V2"
}

const getDateStr = (timeStamp) => {
    if(!timeStamp) {
        timeStamp = new Date()
    }
    const year = timeStamp.getFullYear()
    const month = timeStamp.getMonth() + 1
    const date = timeStamp.getDate()
    return `${year}-${month}-${date}`
}

const createAPL = (handlerInput, documentName, dataSource, speakOutput) => {
    // APL
    if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']){
        console.log("The user's device supports APL");
        
        if (!dataSource) {
            dataSource = {
                "onlyTextData": {
                    "type": "object",
                    "objectId": "headlineSample",
                    "properties": {
                        "backgroundImage": {
                            "sources": [
                                {
                                    "url": apl.bgImage,
                                    "size": "large"
                                }
                            ]
                        },
                        "textContent": {
                            "primaryText": {
                                "type": "PlainText",
                                "text": speakOutput
                            }
                        },
                        "logoUrl": apl.logoUrl,
                        "welcomeSpeechSSML": `<speak><amazon:emotion name='excited' intensity='medium'>${speakOutput}</amazon:emotion></speak>`
                    },
                    "transformers": [
                        {
                            "inputPath": "welcomeSpeechSSML",
                            "transformer": "ssmlToSpeech",
                            "outputName": "welcomeSpeech"
                        }
                    ]
                }
            }
        }
    
        const token = documentName + "Token";
    
        // Add the RenderDocument directive to the response
        handlerInput.responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: token,
            document: {
                src: 'doc://alexa/apl/documents/' + documentName,
                type: 'Link'
            },
            datasources: dataSource
        });

    } else {
        // Just log the fact that the device doesn't support APL.
        // In a real skill, you might provide different speech to the user.
        console.log("The user's device doesn't support APL. Retest on a device with a screen")
    }
}

if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function(str, newStr){

		// If a regex pattern
		if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
			return this.replace(str, newStr);
		}

		// If a string
		return this.replace(new RegExp(str, 'g'), newStr);

	};
}


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to blibli';
        
        createAPL(handlerInput, "OnlyText", null, speakOutput)

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// blibli products search
const GetSearchTermIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'searchTerm';
    },
    async handle(handlerInput) {
        console.log('handlerInput: ', JSON.stringify(handlerInput))
        const slotValue = Alexa.getSlotValue(handlerInput.requestEnvelope, 'search')
        console.log('search slotvalue: ', slotValue)
        
        let returnOutput = 'sorry no products found'
        let aplCalled = false
        try {
            const path = `${ngRokDomain}/backend/search/products?sort=&page=1&start=0&searchTerm=${slotValue}&intent=true&merchantSearch=true&multiCategory=true&customUrl=&&channelId=mobile-web&showFacet=false&userIdentifier=536652622&isMobileBCA=false&userLatLong=-6.197754600000001%2C106.8242036&userLocationCity=Kota%20Jakarta%20Pusat%27`
            console.log('search path: ', path)
            const data = await axios.get(path)
            let products = data.data.data.products;
            console.log('search products: ', products)
            products = products.slice(0, resLimit);
            console.log('search limit products: ', products)
            const productsLength = products.length
            if(productsLength > 1) {
                returnOutput = products.reduce((prev, curr) => {
                    const name = curr.name;
                    let price = curr.price.minPrice
                    const previousValue = typeof prev === 'object' ? `${prev.name} for ${prev.price.minPrice} rupiah.` : prev
                    const currStr = curr ? `${name} for ${price} rupiah.` : ''
                    return `${previousValue} ${currStr} \n`
                })
                const header = `Top ${productsLength} products are. `
                returnOutput = header + returnOutput
            }
            else if (productsLength === 1) {
                const item = products[0]
                const name = item.name;
                const price = item.price.minPrice
                returnOutput = `${name} for ${price} rupiah.`
            }
            
            const listItems = products.map(item => ({primaryText: item.name, secondaryText: `${item.price.priceDisplay}`, imageSource: item.images[0]}))
            const dataSource = {
                "apiResponseData": {
                    "type": "object",
                    "objectId": "imageListSample",
                    "backgroundImage": {
                        "sources": [
                            {
                                "url": apl.bgImage,
                                "size": "large"
                            }
                        ]
                    },
                    "title": `Top ${productsLength} products are`,
                    "listItems": listItems,
                    "logoUrl": apl.logoUrl
                }
            }
            createAPL(handlerInput, "ImageList", dataSource)
            aplCalled = true
        }
        catch (err) {
            returnOutput = 'sorry no products found'
        }
    
        // const speakOutput = slotValue;
        const speakOutput = returnOutput;
        
        if(!aplCalled) {
            createAPL(handlerInput, "OnlyText", null, speakOutput)
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// blibli hotel search
const GetHotelSearchIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'hotelSearch';
    },
    async handle(handlerInput) {
        const province = Alexa.getSlotValue(handlerInput.requestEnvelope, 'province')
        console.log('province value: ', province)
        // const dateStr = Alexa.getSlotValue(handlerInput.requestEnvelope, 'date')
        const dateStr = ''
        const autoCompleteProvincePath = `${ngRokDomain}/backend/travel/hotel/v2/hotels/autocomplete?query=${province.toLowerCase()}&size=15`
        const findHotelPath = `${ngRokDomain}/backend/travel/hotel/v2/hotels/stream`
        
        let returnOutput = 'sorry no hotels found'
        let aplCalled = false
        try {
            let timeStamp = null
            let checkIn = getDateStr();
            let checkOut = getDateStr(new Date(new Date(). getTime() + 24 * 60 * 60 * 1000));
            if (dateStr && dateStr.toLowerCase() === 'tomorrow') {
                checkIn = getDateStr(new Date(new Date(). getTime() + 24 * 60 * 60 * 1000));
                checkOut = getDateStr(new Date(new Date(). getTime() + 48 * 60 * 60 * 1000));
            }
            // const todayTimeStamp = new Date(new Date(). getTime() + 1 * 60 * 60 * 1000);
            
            
            const provinceData = await axios.get(autoCompleteProvincePath);
            console.log('provinceData: ', provinceData)
            console.log('destinations: ', provinceData.data.value)
            let destination = provinceData.data.value.destinations[0]
            console.log('destination value: ', destination)
            
            
            const { id, name, path } = destination
            hotelPayload.query = id;
            hotelPayload.id = id;
            hotelPayload.path = path;
            hotelPayload.checkIn = checkIn;
            hotelPayload.checkOut = checkOut;
            // hotelPayload.checkIn = '2021-12-19';
            // hotelPayload.checkOut = '2021-12-20';
            
            console.log('hotelPayload: ', hotelPayload)
            
            const headers = {
                'Content-Type': 'application/json;charset=UTF-8'
            }
            const hotelData = await axios.post(findHotelPath, hotelPayload, {
                headers
            });
            console.log('hotelData: ', hotelData)
            const hotels = hotelData.data.value.hotels.slice(0, resLimit)
            const hotelsLength = hotels.length
            
            if(hotelsLength > 1) {
                returnOutput = hotels.reduce((prev, curr) => {
                    const name = curr.name;
                    let price = curr.priceAvailability.price
                    const previousValue = typeof prev === 'object' ? `${prev.name} for ${prev.priceAvailability.price} rupiah.` : prev
                    const currStr = curr ? `${name} for ${price} rupiah.` : ''
                    return `${previousValue} ${currStr}`
                })
                const header = `Top ${hotelsLength} hotels are. `
                returnOutput = header + returnOutput + '. Prices are for a single day'
            }
            else if (hotelsLength === 1) {
                const item = hotels[0]
                const name = item.name;
                const price = item.priceAvailability.price
                returnOutput = `${name} for ${price} rupiah. Prices are for a single day`
            }
            
            const listItems = hotels.map(item => ({primaryText: item.name, secondaryText: `Rp${(item.priceAvailability.price)} / day`, imageSource: item.imageUrl}))
            const dataSource = {
                "apiResponseData": {
                    "type": "object",
                    "objectId": "imageListSample",
                    "backgroundImage": {
                        "sources": [
                            {
                                "url": apl.bgImage,
                                "size": "large"
                            }
                        ]
                    },
                    "title": `Top ${hotelsLength} hotels are`,
                    "listItems": listItems,
                    "logoUrl": apl.logoUrl
                }
            }
            createAPL(handlerInput, "ImageList", dataSource)
            aplCalled = true
        }
        catch (err) {
            console.log('erro hotel: ', err.message)
            returnOutput = 'sorry no hotels found'
        }
    
        // const speakOutput = slotValue;
        const speakOutput = returnOutput;
        
        if(!aplCalled) {
            createAPL(handlerInput, "OnlyText", null, speakOutput)
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// blibli events search
const GetEventsSearchHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'eventsIntent';
    },
    async handle(handlerInput) {
        console.log('handlerInput: ', JSON.stringify(handlerInput))
        
        let returnOutput = 'sorry no events found'
        let aplCalled = false
        try {
            const headers = {
                'Content-Type': 'application/json;charset=UTF-8'
            }
            const searchPayload = {
            	"query":"nearest.event",
            	"type":"homepage.nearest.event"
            }
            const searchIdData = await axios.post(`${ngRokDomain}/backend/tivo/search/_search`, searchPayload, {
                headers
            })
            console.log('searchIdData: ', searchIdData)
            let searchId = searchIdData.data.data.searchId;
            console.log('searchId: ', searchId)
            const streamPayload = {
            	"filters":null,
            	"searchId":searchId,
            	"size":21,
            	"showFilter":true
            }
            console.log('streamPayload: ', streamPayload)
            const eventData = await axios.post(`${ngRokDomain}/backend/tivo/search/_stream`, streamPayload, {
                headers
            })
            console.log('eventData: ', eventData)
            const products = eventData.data.data.products.slice(0, resLimit)
            console.log('products: ', products)
            const productsLength = products.length
            if(productsLength > 1) {
                returnOutput = products.reduce((prev, curr) => {
                    const { name, description } = curr
                    const previousValue = typeof prev === 'object' ? `${prev.name} on ${prev.description}.` : prev
                    const currStr = curr ? `${name} on ${description}.` : ''
                    return `${previousValue} ${currStr} \n`
                })
                const header = `Top ${productsLength} events are. `
                returnOutput = header + returnOutput
            }
            else if (productsLength === 1) {
                const item = products[0]
                const { name, description } = item
                returnOutput = `${name} on ${description}.`
            }
            
            const listItems = products.map(item => ({primaryText: item.name, secondaryText: `${item.description}`, imageSource: item.imageUrl}))
            const dataSource = {
                "apiResponseData": {
                    "type": "object",
                    "objectId": "imageListSample",
                    "backgroundImage": {
                        "sources": [
                            {
                                "url": apl.bgImage,
                                "size": "large"
                            }
                        ]
                    },
                    "title": `Top ${productsLength} events are`,
                    "listItems": listItems,
                    "logoUrl": apl.logoUrl
                }
            }
            createAPL(handlerInput, "ImageList", dataSource)
            aplCalled = true
        }
        catch (err) {
            returnOutput = 'sorry no events found'
        }
    
        // const speakOutput = slotValue;
        const speakOutput = returnOutput;
        
        if(!aplCalled) {
            createAPL(handlerInput, "OnlyText", null, speakOutput)
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// blibli promotions search
const GetPromotionIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'promotion';
    },
    async handle(handlerInput) {
        let returnOutput = 'sorry no promos found'
        let aplCalled = false
        try {
            const sort = 'PROMOTION_POPULARITY'
            const data = await axios.get(`${ngRokDomain}/backend/content/promotions?sort=${sort}&page=1`)
            let promos = data.data.data;
            promos = promos.slice(0, resLimit);
            console.log('promos: ', promos)
            const promosLength = promos.length
            if(promosLength > 1) {
                returnOutput = promos.reduce((prev, curr) => {
                    const { name, endTime } = curr
                    const previousValue = typeof prev === 'object' ? `${prev.name} ends on ${new Date(prev.endTime).toDateString()}.` : prev
                    return `${previousValue} ${name} ends on ${new Date(endTime).toDateString()}.`
                })
                const header = `Top ${promosLength} promos are. `
                returnOutput = header + returnOutput
            }
            else if (promosLength === 1) {
                const item = promos[0]
                const { name, endTime } = item
                returnOutput = `${name} ends on ${new Date(endTime).toDateString()}.`
            }
            const listItems = promos.map(item => ({primaryText: item.name, imageSource: item.image, secondaryText: `${new Date(item.startTime).toLocaleDateString()} - ${new Date(item.endTime).toLocaleDateString()}`}))
            const dataSource = {
                "apiResponseData": {
                    "type": "object",
                    "objectId": "imageListSample",
                    "backgroundImage": {
                        "sources": [
                            {
                                "url": apl.bgImage,
                                "size": "large"
                            }
                        ]
                    },
                    "title": `Top ${promosLength} promos are`,
                    "listItems": listItems,
                    "logoUrl": apl.logoUrl
                }
            }
            createAPL(handlerInput, "ImageList", dataSource)
            aplCalled = true
        }
        catch (err) {
            returnOutput = 'sorry no promotions found'
        }
        
        // const speakOutput = slotValue;
        const speakOutput = returnOutput;
        
        if(!aplCalled) {
            createAPL(handlerInput, "OnlyText", null, speakOutput)
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        
        createAPL(handlerInput, "OnlyText", null, speakOutput)

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Please try with another query';
        
        createAPL(handlerInput, "OnlyText", null, speakOutput)

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;
        
        createAPL(handlerInput, "OnlyText", null, speakOutput)

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);
        
        createAPL(handlerInput, "OnlyText", null, speakOutput)

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        GetSearchTermIntentHandler,
        // GetPromotionIntentHandler,
        GetHotelSearchIntent,
        GetEventsSearchHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();