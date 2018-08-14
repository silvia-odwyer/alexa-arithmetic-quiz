const Alexa = require('ask-sdk-core');

/* All Intent Handlers */
const LaunchRequestHandler = {
  // Checks if a launch request was fired
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === `LaunchRequest`;
  },
  handle(handlerInput) {
    let ranIndex1 = getRandom(0, welcomeMessages.length - 1);
    let ranWelcomeMessage = welcomeMessages[ranIndex1];

    let ranIndex2 = getRandom(0, welcomeInstructions.length - 1);
    let ranWelcomeInstruction = welcomeInstructions[ranIndex2];

    let welcome_concat = `${ranWelcomeMessage} ${ranWelcomeInstruction} What level would you like to play?`;

    return handlerInput.responseBuilder
      .speak(welcome_concat)
      .reprompt(helpMessage)
      .getResponse();
  },
};

// IN-GAME LEVEL HANDLERS 
// I'm using separate handlers for each level, because levels may include extra unlockables,
// so set up of those would differ depending on the level.

// Sets level to Easy Mode.
const EasyQuizHandler = {
  // Checks if an `enable easy/basic mode` quiz request was fired
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log(JSON.stringify(request));
    return request.type === "IntentRequest" &&
      (request.intent.name === "EasyQuizIntent" || request.intent.name === "AMAZON.StartOverIntent");
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let message;
    if (attributes.inGame === "true") {
      message = "You can't change levels while in-game. " + attributes.currentQuestion;
    }
    else {
      setLevel("easy", handlerInput);
      message = "Easy mode enabled! If you're ready to begin, say start quiz. " 
    }
    return handlerInput.responseBuilder
      .speak(message)
      .reprompt(helpMessage)
      .getResponse();
  },
};

// Sets game level to Intermediate.
const IntermediateQuizHandler = {
  // Checks if an `enable intermediate mode` quiz request was fired
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log(JSON.stringify(request));
    return request.type === "IntentRequest" &&
      (request.intent.name === "IntermediateQuizIntent" || request.intent.name === "AMAZON.StartOverIntent");
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let message;
    if (attributes.inGame === "true") {
      message = "You can't change levels while in-game. "  + attributes.currentQuestion;
    }
    else {
      setLevel("intermediate", handlerInput);
      message = "Intermediate mode enabled! If you're ready to begin, say start quiz. "
    }
    return handlerInput.responseBuilder
      .speak(message)
      .reprompt(helpMessage)
      .getResponse();
  },
};

// Sets game level to Advanced.

const AdvancedQuizHandler = {
  // Checks if an `enable advanced mode` quiz request was fired
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log(JSON.stringify(request));
    return request.type === "IntentRequest" &&
      (request.intent.name === "AdvancedQuizIntent" || request.intent.name === "AMAZON.StartOverIntent");
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let message;
    if (attributes.inGame === "true") {
      message = "You can't change levels while in-game. " + attributes.currentQuestion;
    }
    else {
      setLevel("advanced", handlerInput);
      message = "Advanced mode enabled! If you're ready to begin, say start quiz. " 
    }
    return handlerInput.responseBuilder
      .speak(message)
      .reprompt(helpMessage)
      .getResponse();
  },
};

const QuizHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log(JSON.stringify(request));
    return request.type === "IntentRequest" &&
      (request.intent.name === "QuizIntent" || request.intent.name === "AMAZON.StartOverIntent");
  },
  handle(handlerInput) {

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const response = handlerInput.responseBuilder;
    attributes.counter = 0;
    attributes.quizScore = 0;

    // User never specified a level, so they are reprompted to do so, continually, until they do.
    if (levels.includes(attributes.level) === false) {
      speakOutput = "You didn't specify a level. What level would you like to play, easy, intermediate, or advanced?";
      repromptOutput = speakOutput;
    }
    else {
      attributes.state = states.QUIZ;
      attributes.inGame = "true";
      var question = askQuestion(handlerInput);
      speakOutput = `Ok. I will ask you ${attributes.rounds} arithmetic questions. ` + question;
      repromptOutput = question;

      const item = attributes.quizItem;
      const property = attributes.quizProperty;

      if (supportsDisplay(handlerInput)) {
        const title = `Question #${attributes.counter}`;
        const backgroundImage = new Alexa.ImageHelper().addImageInstance(getBackgroundImage(attributes.quizItem.Abbreviation)).getImage();
        const itemList = [];
        
        response.addRenderTemplateDirective({
          type: 'ListTemplate1',
          token: 'Question',
          backButton: 'hidden',
          backgroundImage,
          title,
          listItems: itemList,
        });
      }
    }


    return response.speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

const AnswerHandler = {
  canHandle(handlerInput) {

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return attributes.state === states.QUIZ &&
      request.type === 'IntentRequest' &&
      request.intent.name === 'AnswerIntent';
  },
  handle(handlerInput) {

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const response = handlerInput.responseBuilder;

    var speakOutput = ``;
    var repromptOutput = ``;
    const item = attributes.quizItem;
    const property = attributes.quizProperty;
    const actual_answer = attributes.actual_answer;
    const number_one = attributes.number_one;
    const number_two = attributes.number_two;
    const operator = attributes.operator;

    const isCorrect = compareSlots(handlerInput.requestEnvelope.request.intent.slots, actual_answer);
    var simpleCardMsg = "";

    if (isCorrect) {
      speakOutput = getSpeechCon(true);
      let randomNum = getRandom(0, correct_msgs.length - 1);
      let correct_msg = correct_msgs[randomNum];
      speakOutput += ` ${correct_msg}`;
      simpleCardMsg += correct_msg;
      attributes.quizScore += 1;
      handlerInput.attributesManager.setSessionAttributes(attributes);

    } else {
      let randomIncorrectIndex = getRandom(0, incorrect_msgs.length - 1);

      let incorrect_msg = incorrect_msgs[randomIncorrectIndex];
      speakOutput += incorrect_msg;
      speakOutput = getSpeechCon(false);
      speakOutput += `${number_one} ${operator} ${number_two} is ${actual_answer}. `

      simpleCardMsg += incorrect_msg;

    }

    var question = ``;

    if (attributes.counter < attributes.rounds) {
      // Only tell the user their current score every 2nd question.
      let get_counter_or_not = getRandom(0, 1);
      if (get_counter_or_not === 1) {
        speakOutput += ` ${getCurrentScore(attributes.quizScore, attributes.counter)}`
      }
      let percentage = (attributes.quizScore / attributes.counter) * 100;
      if (percentage === 100 && get_counter_or_not === 0) {
        let celebratory_msgs = ["Wow, you're on a roll!", "Wow, no wrong answers yet! Keep it up!", "Wow, you're on a streak!"];
        let ran_n = getRandom(0, celebratory_msgs.length - 1);
        let ran_celebratory_msg = celebratory_msgs[ran_n];
        speakOutput += ran_celebratory_msg;
      }
      question = askQuestion(handlerInput);

      simpleCardMsg += ` ${question}`;
      speakOutput += question;
      repromptOutput = question;

      if (supportsDisplay(handlerInput)) {
        const title = `Question #${attributes.counter}`;
        const primaryText = new Alexa.RichTextContentHelper().withPrimaryText(getQuestionWithoutOrdinal(attributes.quizProperty, attributes.quizItem)).getTextContent();
        const backgroundImage = new Alexa.ImageHelper().addImageInstance(getBackgroundImage(attributes.quizItem.Abbreviation)).getImage();
        const itemList = [];
        getAndShuffleMultipleChoiceAnswers(attributes.selectedItemIndex, attributes.quizItem, attributes.quizProperty).forEach((x, i) => {
          itemList.push(
            {
              "token": x,
              "textContent": new Alexa.PlainTextContentHelper().withPrimaryText(x).getTextContent(),
            }
          );
        });
        response.addRenderTemplateDirective({
          type: 'ListTemplate1',
          token: 'Question',
          backButton: 'hidden',
          backgroundImage,
          title,
          listItems: itemList,
        });
      }
      return response.speak(speakOutput)
        .withSimpleCard(simpleCardMsg)
        .reprompt(repromptOutput)
        .getResponse();
    }
    else {
      let ranIndex3 = getRandom(0, exitSkillMessages.length - 1)
      speakOutput += getFinalScore(attributes.quizScore, attributes.counter) + exitSkillMessages[2];

      // Randomization of star rating message
      // Once every 30 times, at the end of the game, the user will be invited to give the game a rating. 
      let random_num = getRandom(0, 10);
      if (random_num === 5) {
        speakOutput += " If you could give this game a rating or review on the Amazon Alexa store, the developer of Quick Math will be able to make more games just like this. Thank you so much!"
      }
      if (supportsDisplay(handlerInput)) {
        const title = 'Thank you for playing';
        const primaryText = new Alexa.RichTextContentHelper().withPrimaryText(getFinalScore(attributes.quizScore, attributes.counter)).getTextContent();
        response.addRenderTemplateDirective({
          type: 'BodyTemplate1',
          backButton: 'hidden',
          title,
          textContent: primaryText,
        });
      }
      return response.speak(speakOutput).getResponse();
    }
  },
};

const RepeatHandler = {
  canHandle(handlerInput) {

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return attributes.state === states.QUIZ &&
      request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.RepeatHandler';
  },
  handle(handlerInput) {

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const question = getQuestion(attributes.counter, attributes.quizproperty, attributes.quizitem);

    return handlerInput.responseBuilder
      .speak(question)
      .reprompt(question)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {

    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.HelpHandler';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(helpMessage)
      .reprompt(helpMessage)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return request.type === `IntentRequest` && (
      request.intent.name === 'AMAZON.StopIntent' ||
      request.intent.name === 'AMAZON.PauseIntent' ||
      request.intent.name === 'AMAZON.CancelIntent'
    );
  },
  handle(handlerInput) {
    let ranExitIndex = getRandom(0, earlyExitSkillMessages.length - 1);
    let early_exit_msg = earlyExitSkillMessages[ranExitIndex]
    return handlerInput.responseBuilder
      .speak(early_exit_msg)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    console.log("Error Raised!");
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${JSON.stringify(error)}`);
    console.log(`Handler Input: ${JSON.stringify(handlerInput)}`);

    return handlerInput.responseBuilder
      .speak(helpMessage)
      .reprompt(helpMessage)
      .getResponse();
  },
};

const RepeatRequestHandler = {
  // Checks if a repeat request was fired
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "IntentRequest" &&
      (request.intent.name === "RepeatRequestIntent");
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return handlerInput.responseBuilder
      .speak(attributes.currentQuestion)
      .reprompt(helpMessage)
      .getResponse();
  },
};


const RepeatIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log(JSON.stringify(request));
    return request.type === "IntentRequest" &&
      (request.intent.name === "RepeatIntent" || request.intent.name === "AMAZON.StartOverIntent");
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let message;
    if (attributes.inGame === "true") {
      message = `${attributes.currentQuestion}`; 
    }
    else {
      message = helpMessage;
    }

    return handlerInput.responseBuilder
      .speak(message)
      .reprompt(helpMessage)
      .getResponse();
  },
};

/* CONSTANTS */

// Constants from AMAZON's Alexa dev team
// SpeechCons enhance Alexa's humanistic qualities when saying celebratory/non-celebratory words, making speech more lifelike.
const speechConsCorrect = ['Booya', 'All righty', 'Bam', 'Bazinga', 'Bingo', 'Boom', 'Bravo', 'Cha Ching', 'Cheers', 'Dynomite', 'Hip hip hooray', 'Hurrah', 'Hurray', 'Huzzah', 'Oh dear.  Just kidding.  Hurray', 'Kaboom', 'Kaching', 'Oh snap', 'Phew', 'Righto', 'Way to go', 'Well done', 'Whee', 'Woo hoo', 'Yay', 'Wowza', 'Yowsa'];
const speechConsWrong = ['Argh', 'Aw man', 'Blarg', 'Blast', 'Boo', 'Bummer', 'Darn', "D'oh", 'Dun dun dun', 'Eek', 'Honk', 'Le sigh', 'Mamma mia', 'Oh boy', 'Oh dear', 'Oof', 'Ouch', 'Ruh roh', 'Shucks', 'Uh oh', 'Wah wah', 'Whoops a daisy', 'Yikes'];
const states = {
  START: `_START`,
  QUIZ: `_QUIZ`,
};

// Extra in-game constants.
const skillBuilder = Alexa.SkillBuilders.custom();
const answer_arr = [];
const imagePath = "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/{0}x{1}/{2}._TTH_.png";
const backgroundImagePath = "https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/{0}x{1}/{2}._TTH_.png"
const levels = ["easy", "intermediate", "advanced"]

const correct_msgs = ["You're right!", "Right answer!", "That's correct!", "You are right!", "Yep, that's the right answer!", "Congrats, you're right!", "Yep, you're right!"];
const incorrect_msgs = ["Wrong answer.", "Sorry, you're wrong.", "That's an incorrect answer."]

const welcomeMessages = ["Welcome to Quick Math, the game that puts your arithmetic skills to the test!", "Welcome to Quick Math! Are you ready to have your arithmetic skills tested?", "Hey! Welcome to Quick Math!", "Welcome to Quick Math! If you're ready to have your arithmetic knowledge tested, I'm ready to play!", "Hello and welcome to Quick Math, the game that tests your arithmetic skills."]
const welcomeInstructions = ["There are three levels available: easy, intermediate, and advanced.", "I've got three levels available: easy, intermediate, or advanced.", "You can ask me to start a quiz in easy, intermediate, or advanced mode."];
const exitSkillMessages = [`Thank you for playing Quick Math! Let's play again soon.`, "Thanks for playing Quick Math. I had a great time. I hope you did too! We should play again soon!", "Thanks for playing Quick Math. We should definitely play again soon!", "Thanks for playing Quick Math, I hope you play again soon.", "That was a lot of fun! I had a great time. Thanks for playing Quick Math.", "Wow, I had a lot of fun asking you those questions! Thanks for playing!", "That was a heap of fun, I had a fantastic time! We should play again soon!"];
const earlyExitSkillMessages = ["I'm sorry you have to leave early. Let's play again soon.", "Thanks for trying out Quick Math. Let's play again soon."]

const repromptSpeech = `Would you like to play again?`;
const helpMessage = `If you want to play a quiz in easy mode, just say play easy quiz, if you want to play in intermediate, just say play intermediate quiz. The same applies for advanced. What would you like to do?`;
const useCardsFlag = true;

/* HELPER FUNCTIONS */

// returns true if the skill is running on a device with a display (show|spot)
function supportsDisplay(handlerInput) {
  var hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display
  return hasDisplay;
}

function getBadAnswer(item) {
  return `I'm sorry. ${item} is not something I know very much about in this skill. ${helpMessage}`;
}

function getCurrentScore(score, counter) {
  return `Your current score is ${score} out of ${counter}. `;
}

function getFinalScore(score, counter) {
  return `Your final score is ${score} out of ${counter}. `;
}

function getCardTitle(item) {
  return item.StateName;
}

function getSmallImage(item) {
  return `https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/720x400/${item.Abbreviation}._TTH_.png`;
}

function getLargeImage(item) {
  return `https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/1200x800/${item.Abbreviation}._TTH_.png`;
}

function getImage(height, width, label) {
  return imagePath.replace("{0}", height)
    .replace("{1}", width)
    .replace("{2}", label);
}

function getBackgroundImage(label, height = 1024, width = 600) {
  return backgroundImagePath.replace("{0}", height)
    .replace("{1}", width)
    .replace("{2}", label);
}

function getSpeechDescription(item) {
  return `${item.StateName} is the ${item.StatehoodOrder}th state, admitted to the Union in ${item.StatehoodYear}.  The capital of ${item.StateName} is ${item.Capital}, and the abbreviation for ${item.StateName} is <break strength='strong'/><say-as interpret-as='spell-out'>${item.Abbreviation}</say-as>.  I've added ${item.StateName} to your Alexa app.  Which other state or capital would you like to know about?`;
}

function formatCasing(key) {
  return key.split(/(?=[A-Z])/).join(' ');
}

function getQuestion(counter, property, item) {
  return `Here is your ${counter}th question.  What is the ${formatCasing(property)} of ${item.StateName}?`;
}

// getQuestionWithoutOrdinal returns the question without the ordinal and is
// used for the echo show.
function getQuestionWithoutOrdinal(property, item) {
  return "What is the " + formatCasing(property).toLowerCase() + " of " + item.StateName + "?";
}

function getAnswer(property, item) {
  switch (property) {
    case 'Abbreviation':
      return `The ${formatCasing(property)} of ${item.StateName} is <say-as interpret-as='spell-out'>${item[property]}</say-as>. `;
    default:
      return `The ${formatCasing(property)} of ${item.StateName} is ${item[property]}. `;
  }
}

function getRandom(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1)) + min);
}

function askQuestion(handlerInput) {
  console.log("RUNNING: askQuestion()");
  const math_array = ["plus", "multiplied by", "subtract", "divided by"];

  //GET SESSION ATTRIBUTES
  const attributes = handlerInput.attributesManager.getSessionAttributes();

  //Get game level
  let level = attributes.level;
  let randomOperator;
  let randomNumber1;
  let randomNumber2;
  let ranIndex = getRandom(0, math_array.length - 1);
  // Set operator depending on the game's level.
  // Set number ranges depending on the game's level. 
  // Basic mode would involve smaller numbers, while intermediate
  // and advanced modes would involve larger numbers.
  if (level == "easy") {
    randomOperator = math_array[ranIndex];
    if (randomOperator === "plus" || randomOperator == "subtract") {
      randomNumber1 = getRandom(5, 20);
      randomNumber2 = getRandom(5, 20);
    }
    else if (randomOperator === "multiplied by" || "divided by") {
      randomNumber1 = getRandom(2, 7);
      randomNumber2 = getRandom(2, 7);
    }

  }
  else if (level == "intermediate") {
    randomOperator = math_array[ranIndex];

    if (randomOperator === "plus" || randomOperator === "subtract") {
      randomNumber1 = getRandom(8, 50);
      randomNumber2 = getRandom(8, 50);
    }
    else if (randomOperator === "multiplied by" || "divided by") {
      randomNumber1 = getRandom(5, 12);
      randomNumber2 = getRandom(5, 12);
    }

  }
  else {
    randomOperator = math_array[ranIndex];
    if (randomOperator === "plus" || randomOperator === "subtract") {
      randomNumber1 = getRandom(15, 70);
      randomNumber2 = getRandom(15, 70);
    }
    else if (randomOperator === "multiplied by" || "divided by") {
      randomNumber1 = getRandom(7, 14);
      randomNumber2 = getRandom(7, 14);
    }

  }

  let random_math_arr_index = getRandom(0, math_array.length - 1);
  let random = getRandom(0, 50);

  let answer = 0;
  if (randomOperator == "plus") {
    answer = randomNumber1 + randomNumber2;
  }
  else if (randomOperator == "subtract") {
    if (randomNumber1 < randomNumber2) {
      let temp = randomNumber1;
      randomNumber1 = randomNumber2;
      randomNumber2 = temp;
    }
    answer = randomNumber1 - randomNumber2
  }

  else if (randomOperator == "multiplied by") {
    answer = randomNumber1 * randomNumber2;
  }

  else if (randomOperator == "divided by") {
    
    // get all multiples of ranNum2
    let multiples = [];
    for (let k = 0; k < 9; k += 1) {
      multiples.push(k * randomNumber2);
    }
    let ran_multiple_index = getRandom(0, multiples.length - 1);
    randomNumber1 = multiples[ran_multiple_index];
    answer = randomNumber1 / randomNumber2;
  }

  answer_arr.push(answer);

  const question = getMathQuestion(attributes.counter, randomOperator, randomNumber1, randomNumber2);

  //SET QUESTION DATA TO ATTRIBUTES
  attributes.actual_answer = answer;
  attributes.number_one = randomNumber1;
  attributes.number_two = randomNumber2;
  attributes.operator = randomOperator;
  attributes.selectedItemIndex = random;
  attributes.counter += 1;
  attributes.currentQuestion = question;

  //SAVE ATTRIBUTES
  handlerInput.attributesManager.setSessionAttributes(attributes);

  return question;
}


function setLevel(level, handlerInput) {
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  let level_dict = {"easy" : 10, "intermediate" : 20, "advanced" : 30}
  attributes.level = level;
  attributes.rounds = level_dict[level];
  handlerInput.attributesManager.setSessionAttributes(attributes);
}
function getMathQuestion(counter, operator, randomNumber1, randomNumber2) {
  return `Here is your ${counter + 1}th question.  What is ${randomNumber1} ${operator} ${randomNumber2}?`;

}

function compareSlots(slots, value) {
  for (const slot in slots) {
    if (Object.prototype.hasOwnProperty.call(slots, slot) && slots[slot].value !== undefined) {
      if (slots[slot].value.toString().toLowerCase() === value.toString().toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}


function getSpeechCon(type) {
  if (type) return `<say-as interpret-as='interjection'>${speechConsCorrect[getRandom(0, speechConsCorrect.length - 1)]}! </say-as><break strength='strong'/>`;
  return `<say-as interpret-as='interjection'>${speechConsWrong[getRandom(0, speechConsWrong.length - 1)]} </say-as><break strength='strong'/>`;
}


function getAndShuffleMultipleChoiceAnswers(currentIndex, item, property) {
  return shuffle(getMultipleChoiceAnswers(currentIndex, item, property));
}

// This function randomly chooses 3 answers 2 incorrect and 1 correct answer to
// display on the screen using the ListTemplate. It ensures that the list is unique.
function getMultipleChoiceAnswers(currentIndex, item, property) {

  // insert the correct answer first
  let answerList = [item[property]];

  let count = 0
  let upperBound = 12

  let seen = new Array();
  seen[currentIndex] = 1;

  while (count < upperBound) {
    let random = getRandom(0, 52);

    // only add if we haven't seen this index
    if (seen[random] === undefined) {
      answerList.push(data[random][property]);
      count++;
    }
  }

  // remove duplicates from the list.
  answerList = answerList.filter((v, i, a) => a.indexOf(v) === i)
  // take the first three items from the list.
  answerList = answerList.slice(0, 3);
  return answerList;
}

// This function takes the contents of an array and randomly shuffles it.
function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

exports.handler = skillBuilder
  .addRequestHandlers(
  LaunchRequestHandler,
  QuizHandler,
  AnswerHandler,
  RepeatHandler,
  RepeatRequestHandler,
  EasyQuizHandler,
  IntermediateQuizHandler,
  AdvancedQuizHandler,
  HelpHandler,
  ExitHandler,
  SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();