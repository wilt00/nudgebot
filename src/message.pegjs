// Test at https://pegjs.org/online

{
	function twelveTo24(hr_, mdn_) {
    const hr = parseInt(hr_, 10);
      const mdn = mdn_.toUpperCase();
      if (mdn === "AM" && hr === 12) return 0;
      if (mdn === "PM" && hr !== 12) return hr + 12;
      return hr_;
  }
  
  function incrementUnit(unitObj, newInt) {
    const secs = parseInt(newInt, 10) * unitObj.unitFactor * Math.pow(10, unitObj.e10);
    unitObj.seconds += secs;
    unitObj.e10 += newInt.length;
    return unitObj;
  }
}

/*
1_ ~~One
    [0-2]_     ~~TenElevenTwelve
                :[0-5]#_AM  ~~AbsMins   10:59 AM
                AM          ~~Meridian  10 AM
                hrs         ~~Unit      10 hrs
                ##..._hrs   ~~LongUnit  12345 hrs
    [3-9]_     ~~AboveTwelve
                hrs         ~~Unit      17 hrs
                ##..._hrs   ~~LongUnit  1999 hrs
    :[0-5]#_AM ~~AbsMins                1:59 AM
    AM         ~~Meridian               1 AM
    Hrs        ~~Unit                   1 hr

^1 ~~NotOne
    #         ~~SecondDigit
               hrs          99 hrs
               #... hrs     99999 hrs
    AM                      9 AM
    Hrs                     9 hrs
    :[0-5]#_AM              9:59 AM

Absolute:
at 0#      ~~AbsZero
           [0-5]#       ~~MilMins     -           at 0550
           :[0-5]#_AM   ~~AbsMins     -           at 02:59 AM
           _AM          ~~Meridian    -           at 01 AM
   1_     ~~AbsOne
           AM           ~~Meridian    -           at 1 AM
           :[0-5]#_AM   ~~AbsMins     -           at 1:59 AM
           [012]        ~~AbsTenElevenTwelve
                         _AM         ~~Meridian   at 10 AM
                         :[0-5]#_AM  ~~AbsMins    at 10:59 AM
                         [0-5]#      ~~MilMins    at 1250
           [3-9][0-5]#  ~~MilTeen                 at 1950
   2_      AM           ~~Meridian    -           at 2 AM
           :[0-5]#_AM   ~~AbsMin      -           at 2:59 AM
           [0-4][0-5]#  ~~MilTwenty   -           at 2350
   [^012] ~~AbsAboveTwo
           _AM          ~~Meridian    -           at 9 AM
           :[0-5]#_AM   ~~AbsMins     -           at 9:59 AM

Relative:
in #... hrs ~~RelToken

*/

/*
{
  type: "REL"/"ABS"
  
  // Absolute
  meridian: "AM"/"PM"
  clock: 12/24
  hours: #  (-1 if undefined)
  minutes: #  (-1 if undefined)
  
  // Relative
  seconds: #
  unit: "MIN"/"SEC"/"HR",
  unitFactor: 1/60/3600,
  e10: #
  newRel: t/f 
}
*/

Start = _ ls:(TimeTokenList / AbsTokenList / RelTokenList) _ msg:Message {
  return {
    list: ls,
    message: msg,
  };
}

_ "whitespace" = [ \t\n\r]*

// TimeTokenList = (TimeToken)+
TimeTokenList = (TimeToken/RelToken/AbsToken)+

TimeToken = _ "and"i? _ t:(One / NotOne) _ {return t;}

One = [1] _ u:(TenElevenTwelve / AboveTwelve / AbsMins / Unit / LongUnit / Meridian) {
  if (u.type === "REL") return incrementUnit(u, "1");
  if (u.hours < 0) u.hours = twelveTo24(1, u.meridian);
  return u;
}
NotOne = i:[0,2-9] _ u:(SecondDigit / AbsMins / Unit / Meridian) {
  if (u.type === "REL") return incrementUnit(u, i);
  u.hours = twelveTo24(parseInt(i, 10), u.meridian);
  return u;
}

TenElevenTwelve = i:[0-2] _ u:(AbsMins / LongUnit / Unit / Meridian) {
  if (u.type === "REL") return incrementUnit(u, i);
  u.hours = twelveTo24(parseInt("1" + i, 10), u.meridian);
  return u;
}
AboveTwelve = [3-9] _ (Unit / LongUnit) {return incrementUnit(u, i);}
SecondDigit = i:[0-9] _ u:(Unit / LongUnit) {return incrementUnit(u, i);}

LongUnit = i:$([0-9]+) _ u:Unit {return incrementUnit(u, i);}

// == Relative ==
RelTokenList = _"in"i _ ls:(RelToken)+ {return ls;}
RelToken = _ (("and"i)?) _ I:(("in"i?)) _ u:LongUnit {
  if (I) u.newRel = true;
  return u;
}

// == Absolute ==
AbsTokenList = "at"i _ ls:(AbsToken)+ { return ls; }
AbsToken = _ "and"i? _ "at"i? _ a:(AbsZero / AbsOne / AbsTwo / AbsAboveTwo) _ { return a; }

AbsZero = [0]h:[0-9] m:(MilMins / AbsMins / Meridian) {
  let hrs = parseInt(h, 10);
  if (m.clock === 12) hrs = twelveTo24(hrs, m.meridian)
  m.hours = hrs;
  return m;
}

AbsOne = [1] _ m:(Meridian / AbsMins / AbsTenElevenTwelve / MilTeen) {
  if (m.hours < 0) m.hours = twelveTo24(1, m.meridian);
  return m;
}

AbsTwo = [2] _ m:(Meridian / AbsMins / MilTwenty) {
  if (m.hours < 0) m.hours = twelveTo24(2, m.meridian);
  return m;
}
AbsAboveTwo = h:[^012] _ m:(Meridian / AbsMins) {
  m.hours = twelveTo24(parseInt(h, 10), m.meridian);
  return m;
}

AbsTenElevenTwelve = h:[012] _ m:(Meridian / AbsMins / MilMins) {
  const hrs = parseInt("1" + h, 10)
  m.hours = (m.clock === 12) ? twelveTo24(hrs, m.meridian) : hrs;
  return m;
}

MilTeen = d:[3-9] m:MilMins { m.hours = parseInt("1" + d, 10); return m;}
MilTwenty = d:[0-4] m:MilMins { m.hours = parseInt("2" + d, 10); return m;}
MilMins = mins:($([0-5][0-9])) {
  return {minutes: parseInt(mins, 10), type: "ABS", clock: 24, hours: -1};
}

AbsMins = ":" min:$([0-5][0-9]) _ mdn:Meridian {
  mdn.minutes = parseInt(min, 10);
  return mdn;
}

Unit = _ u:(Minute/Second/Hour) { return u; }
Minute = $("min"i(("s"i/("ute"i("s"i?)))?)) {
  return {unit: "MIN", unitFactor: 60, type: "REL", e10: 0, seconds:0};
}
Second = $("sec"i(("s"i/("ond"i("s"i?)))?)) {
  return {unit:"SEC", unitFactor: 1, type: "REL", e10: 0, seconds:0};
}
Hour = $("h"i(("r"i("s"i?))/("our"i("s"i?)))) {
  return {unit:"HR", unitFactor:3600, type: "REL", e10: 0, seconds:0};
}

Meridian = m:$("am"i / "pm"i) {
  return {meridian: m.toUpperCase(), type: "ABS", clock: 12, hours: -1, minutes: -1};
}

Message = $(.*)
