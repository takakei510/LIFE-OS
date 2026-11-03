import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInput, parseMetadata, filterCandidates, validateAnswer, shortlistCandidates } from './catalog.ts';
const input = { message:'家で静かに発見したい', minutes:15, environment:'home', budget:'free', people:'solo', energy:'low', kind:'any' };
const candidate = { id:'a1', kind:'achievement', name:'発見', condition:'身近な違いを一つ見つける。', category:'日常', domains:['Nature'], axis:'気づく', time:'5分', minutes:5, cost:'無料（手元の物）', environment:'屋内', people:'一人で可能', energy:'軽め', needs:'なし', firstStep:'', longTerm:false, relatedIds:[] };
test('input rejects malformed, oversized, whitespace and forged choices',()=>{
  assert.deepEqual(parseInput(input),input);
  for(const value of [null,[],{}, {...input,message:' '}, {...input,message:'a'.repeat(601)}, {...input,minutes:'15'}, {...input,environment:'secret'}]) assert.throws(()=>parseInput(value));
});
test('metadata distinguishes practice time from time to mastery, supports Notion breaks',()=>{
  const m=parseMetadata('実績の軸: 会得する<br />時間: 練習1回20分・会得まで任意<br />気力: 普通 / 体力: 軽め');
  assert.equal(m.minutes,20);assert.equal(m.longTerm,true);assert.equal(m.energy,'普通');
  assert.equal(parseMetadata('時間: 2時間').minutes,120);
  assert.equal(parseMetadata('時間: 半日').minutes,240);
  assert.equal(parseMetadata('時間: 10分〜20分').minutes,20);
  assert.equal(parseMetadata('').minutes,null);
});
test('hard constraints fail closed on unknown, paid, outside, group and high effort',()=>{
  assert.equal(filterCandidates([candidate],input).length,1);
  for(const patch of [{minutes:null},{minutes:30},{cost:'無料〜少額'},{cost:''},{environment:'公共施設'},{environment:'屋外'},{people:''},{people:'相手が必要'},{energy:'普通'}]) assert.equal(filterCandidates([{...candidate,...patch}],input).length,0);
});
test('filters respect kind and deduplicate same conditions',()=>{
  assert.equal(filterCandidates([candidate,{...candidate,id:'a2'}],input).length,1);
  assert.equal(filterCandidates([candidate],{...input,kind:'quest'}).length,0);
});
test('unknown fields do not leak into parsed consultation',()=>{
  assert.deepEqual(parseInput({...input,secret:'not part of allowed input'}),input);
});
test('model cannot invent candidate IDs, URLs, or duplicate experiences',()=>{
  const answer={message:'小さな発見から。',picks:[{id:'a1',reason:'短時間でできます',firstStep:'物を一つ選ぶ'}]};
  assert.equal(validateAnswer(answer,[candidate]).picks[0].candidate.name,candidate.name);
  assert.throws(()=>validateAnswer({...answer,picks:[{...answer.picks[0],id:'https://evil.example'}]},[candidate]));
  assert.throws(()=>validateAnswer({...answer,picks:[...answer.picks,...answer.picks]},[candidate]));
  const quest={...candidate,id:'q1',kind:'quest',relatedIds:['a1']};
  assert.throws(()=>validateAnswer({...answer,picks:[answer.picks[0],{...answer.picks[0],id:'q1'}]},[candidate,quest]));
});
test('source first step wins over generated text and original condition remains intact',()=>{
  const answer={message:'こんにちは',picks:[{id:'a1',reason:'合いそう',firstStep:'条件を変える'}]};
  const result=validateAnswer(answer,[{...candidate,firstStep:'登録済みの一歩'}]);
  assert.equal(result.picks[0].firstStep,'登録済みの一歩');assert.equal(result.picks[0].candidate.condition,candidate.condition);
});
test('empty suggestions are allowed and malformed output rejected',()=>{
  assert.deepEqual(validateAnswer({message:'今日は見送っても大丈夫',picks:[]},[]).picks,[]);
  for(const value of [null,{}, {message:'a',picks:[{}]},{message:'a'.repeat(351),picks:[]}]) assert.throws(()=>validateAnswer(value,[candidate]));
});
test('shortlist is bounded and prioritizes relevant domains',()=>{
  const many=Array.from({length:200},(_,i)=>({...candidate,id:`a${i}`,condition:`条件${i}`,domains:[i>150?'Music':'Nature']}));
  const list=shortlistCandidates(many,'音楽を楽しみたい');
  assert.equal(list.length,60);assert.equal(list[0].domains[0],'Music');assert.equal(new Set(list.map(c=>c.id)).size,60);
});
