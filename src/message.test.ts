import { expect } from "chai";
import {} from "mocha";
import Message = require("./../src/message.js");

describe("Message", () => {
  describe("#parse()", () => {
    const testValues: [string, Message.IMessageInfo][] = [
      [" at 12 PM", {list:[{hours:12, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" at 5 PM", {list:[{hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" at 5PM", {list:[{hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" at 5pM", {list:[{hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" at 5:00pM", {list:[{hours:17, minutes:0, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" at 11:00pm", {list:[{hours:23, minutes:0, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" at 12:00pm", {list:[{hours:12, minutes:0, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" at 12pm", {list:[{hours:12, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" at 12:00am", {list:[{hours:0, minutes:0, type:"ABS", clock:12, meridian:"AM"}],message: "" }],
      [" at 12am", {list:[{hours:0, minutes:-1, type:"ABS", clock:12, meridian:"AM"}],message: "" }],
      [" at 1am", {list:[{hours:1, minutes:-1, type:"ABS", clock:12, meridian:"AM"}],message: "" }],
      [" at 5PM message", {list:[{hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "message" }],
      [" at 5PMmessage", {list:[{hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "message" }],
      [" at 5 PM message", {list:[{hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "message" }],
      [" at 5:00 PM message", {list:[{hours:17, minutes:0, type:"ABS", clock:12, meridian:"PM"}],message: "message" }],
      [" at 5:00PM message", {list:[{hours:17, minutes:0, type:"ABS", clock:12, meridian:"PM"}],message: "message" }],
      [" at 5:05PM message", {list:[{hours:17, minutes:5, type:"ABS", clock:12, meridian:"PM"}],message: "message" }],
      [" at 5:59PM message", {list:[{hours:17, minutes:59, type:"ABS", clock:12, meridian:"PM"}],message: "message" }],
      [" at 1500 message", {list:[{hours:15, minutes:0, type:"ABS", clock:24}],message: "message" }],
      [" at 1525 message", {list:[{hours:15, minutes:25, type:"ABS", clock:24}],message: "message" }],
      [" at 0825 and 1145 message", {list:[
        {hours:8, minutes:25, type:"ABS", clock:24},
        {hours:11, minutes:45, type:"ABS", clock:24},
      ],message: "message" }],
      [" at 0825 and 1145 and message", {list:[
        {hours:8, minutes:25, type:"ABS", clock:24},
        {hours:11, minutes:45, type:"ABS", clock:24},
      ],message: "and message" }],

      [" 5pM", {list:[{hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" 5 pM", {list:[{hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" 5 PM", {list:[{hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" 5:00pM", {list:[{hours:17, minutes:0, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" 11:00pM", {list:[{hours:23, minutes:0, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" 12:00pM", {list:[{hours:12, minutes:0, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" 12pM", {list:[{hours:12, minutes:-1, type:"ABS", clock:12, meridian:"PM"}],message: "" }],
      [" 12:00aM", {list:[{hours:0, minutes:0, type:"ABS", clock:12, meridian:"AM"}],message: "" }],
      [" 12:00am", {list:[{hours:0, minutes:0, type:"ABS", clock:12, meridian:"AM"}],message: "" }],
      [" 12am", {list:[{hours:0, minutes:-1, type:"ABS", clock:12, meridian:"AM"}],message: "" }],

      [" in 5 minutes", {list:[{ seconds: 300, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel:true}], message: "" }],
      [" in 5 mins", {list:[{ seconds: 300, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel:true}], message: "" }],
      [" in 5mins", {list:[{ seconds: 300, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel:true}], message: "" }],
      [" in 1min", {list:[{ seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel:true}], message: "" }],
      [" in 1 min", {list:[{ seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel:true}], message: "" }],
      [" in 1 minute", {list:[{ seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel:true}], message: "" }],
      [" in 1 second", {list:[{ seconds: 1, type:"REL", unit:"SEC", unitFactor:1, e10:1, newRel:true}], message: "" }],
      [" in 5 hours", {list:[{ seconds: 18000, type:"REL", unit:"HR", unitFactor:3600, e10:1, newRel:true}], message: "" }],
      [" in 5 hours 2 minutes", {list:[
        { seconds: 18000, type:"REL", unit:"HR", unitFactor:3600, e10:1, newRel:true},
        { seconds: 120, type:"REL", unit:"MIN", unitFactor:60, e10:1},
      ], message: "" }],
      [" in 5 hours and 2 minutes", {list:[
        { seconds: 18000, type:"REL", unit:"HR", unitFactor:3600, e10:1, newRel:true},
        { seconds: 120, type:"REL", unit:"MIN", unitFactor:60, e10:1},
      ], message: "" }],
      [" in 5 hours and in 2 minutes", {list:[
        { seconds: 18000, type:"REL", unit:"HR", unitFactor:3600, e10:1, newRel:true},
        { seconds: 120, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel: true},
      ], message: "" }],

      [" 5 minutes", {list:[{ seconds: 300, type:"REL", unit:"MIN", unitFactor:60, e10:1}], message: "" }],
      [" 5 mins", {list:[{ seconds: 300, type:"REL", unit:"MIN", unitFactor:60, e10:1}], message: "" }],
      [" 5mins", {list:[{ seconds: 300, type:"REL", unit:"MIN", unitFactor:60, e10:1}], message: "" }],
      [" 1min", {list:[{ seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1}], message: "" }],
      [" 1 min", {list:[{ seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1}], message: "" }],
      [" 1 minute", {list:[{ seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1}], message: "" }],
      [" 1 second", {list:[{ seconds: 1, type:"REL", unit:"SEC", unitFactor:1, e10:1}], message: "" }],
      [" 2000 seconds", {list:[{ seconds: 2000, type:"REL", unit:"SEC", unitFactor:1, e10:4}], message: "" }],
      [" 20000 seconds", {list:[{ seconds: 20000, type:"REL", unit:"SEC", unitFactor:1, e10:5}], message: "" }],
      [" 12345 seconds", {list:[{ seconds: 12345, type:"REL", unit:"SEC", unitFactor:1, e10:5}], message: "" }],
      [" 12345 minutes", {list:[{ seconds: 740700, type:"REL", unit:"MIN", unitFactor:60, e10:5}], message: "" }],
      [" 5 hours 2 minutes", {list:[
        { seconds: 18000, type:"REL", unit:"HR", unitFactor:3600, e10:1},
        { seconds: 120, type:"REL", unit:"MIN", unitFactor:60, e10:1},
      ], message: "" }],
      [" 5 hours and 2 minutes", {list:[
        { seconds: 18000, type:"REL", unit:"HR", unitFactor:3600, e10:1},
        { seconds: 120, type:"REL", unit:"MIN", unitFactor:60, e10:1},
      ], message: "" }],
      [" 5 hours and in 2 minutes", {list:[
        { seconds: 18000, type:"REL", unit:"HR", unitFactor:3600, e10:1},
        { seconds: 120, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel: true},
      ], message: "" }],

      [" 1 minute and at 5pm", {list:[
        {seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1},
        {hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}
      ], message: "" }],
      [" 1 minute 5pm", {list:[
        {seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1},
        {hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}
      ], message: "" }],
      [" 1 minute and 5pm", {list:[
        {seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1},
        {hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}
      ], message: "" }],
      [" in 1 minute and 5pm", {list:[
        {seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel:true},
        {hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"}
      ], message: "" }],
      [" at 5pm and in 1 minute", {list:[
        {hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"},
        {seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1, newRel:true},
      ], message: "" }],
      [" at 5pm and 1 minute", {list:[
        {hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"},
        {seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1},
      ], message: "" }],
      [" 5pm and 1 minute", {list:[
        {hours:17, minutes:-1, type:"ABS", clock:12, meridian:"PM"},
        {seconds: 60, type:"REL", unit:"MIN", unitFactor:60, e10:1},
      ], message: "" }],
    ];
    testValues.map(t => {
      it(t[0], () => {
        expect(Message.parse(t[0])).to.deep.equal(t[1]);
      });
    });

  });
});
