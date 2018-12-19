// Test at https://pegjs.org/online

Expression
  = Prefix _ time:(RelativeTime / AbsoluteTime) msg:(_ Message)? {
    return {
      time: time,
      message: msg[1],
    };
  }
  
Prefix
  = "~r"i(("emind"i(" "?)"me"i)?)
  
Message = $(.*)
  
AbsoluteTime
  = "at" _ time: Time { return time; }
  
Time = MilTime / ClkTime / WordTime
// Time = ClkTime
  
MilTime "Military Time"
  = time:($([0-2][0-9])$([0-5][0-9])) {
  	return [parseInt(time[0], 10), parseInt(time[1], 10)];
  }
  
WordTime
  = word:("noon"i/"midnight"i) {
    word = word.toLowerCase();
	if (word === "noon") return [12, 0];
    if (word === "midnight") return [0, 0];
  }
  
ClkTime "Clock Time"
  = hour:($([0-9]([0-9]?))) minute:((":" $([0-5][0-9]))?) (_?) meridian:("AM"i/"PM"i) {
  	let hr = parseInt(hour, 10);
    const min = minute ? parseInt(minute[1], 10) : 0;
    meridian = meridian.toUpperCase();
    if (meridian === "PM" && hr !== 12) hr += 12;
    if (meridian === "AM" && hr === 12) hr = 0;
    return [hr, min];
  }
  
RelativeTime
  = "in" _ relMins:Integer _ unit:Unit {
  	return relMins * unit;
  }
  
Unit = Minute / Second / Hour
Minute = ("min"(("s"/("ute"("s"?)))?)) { return 60; }
Second = ("sec"(("s"/("ond"("s"?)))?)) { return 1; }
Hour = ("h"(("r"("s"?))/("our"("s"?)))) { return 360; }

Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*
