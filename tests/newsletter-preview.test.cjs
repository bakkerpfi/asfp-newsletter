const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app/api/send-newsletter/preview/route.ts'), 'utf8');
async function preview(activeCount, history, failPage = false) {
  const calls = [];
  const active = Array.from({length: activeCount}, (_, i) => ({id:i+1,email:`${i}@example.com`}));
  const supabase = { from(table) {
    let head = false, bounds, filters = [];
    const query = {
      select(_fields, options) {head = options?.head; return this;},
      eq(key,value) {filters.push([key,value]); return this;},
      order() {return this;},
      range(start,end) {bounds=[start,end]; return this;},
      maybeSingle() {return Promise.resolve({data:{id:2,company_id:'company'}});},
      then(resolve,reject) {
        calls.push({table,bounds,filters});
        let result;
        if(head) result={count:activeCount};
        else if(table==='newsletter_sends' && failPage && bounds?.[0]===1000) result={error:new Error('history unavailable')};
        else {const rows=table==='subscribers'?active:history.map(subscriber_id=>({subscriber_id}));
          result={data:rows.slice(bounds?.[0]??0,(bounds?.[1]??999)+1)};}
        return Promise.resolve(result).then(resolve,reject);
      }
    }; return query;
  }};
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {
    exports, console:{error(){}}, require(name) {
      if(name==='next/server') return {NextResponse:{json:(body,options)=>({body,status:options?.status??200})}};
      if(name==='@/lib/supabase') return {supabase};
      if(name==='@/lib/tenant-auth') return {requireCompanyAccess:async()=>({company:{id:'company'}})};
      throw new Error(name);
    }
  });
  const response = await exports.POST({json:async()=>({companySlug:'asfp',issueId:2})});
  for(const call of calls.filter(c=>c.table==='newsletter_sends')) {
    assert.deepEqual(call.filters,[['company_id','company'],['issue_id',2],['status','sent']]);
  }
  return response;
}
test('full sent history beyond 1000 yields no false pending recipients',async()=>{
 const r=await preview(1338,Array.from({length:1341},(_,i)=>i+1));
 assert.equal(r.body.audience.pending,0); assert.equal(r.body.audience.alreadySent,1338);
});
test('only active sent recipients count and genuinely unsent stay pending',async()=>{
 const r=await preview(1338,[...Array.from({length:1000},(_,i)=>i+1),9000,9001,9002]);
 assert.equal(r.body.audience.pending,338); assert.equal(r.body.audience.alreadySent,1000);
 assert.equal(r.body.recipients[0].id,1001);
});
test('exact page boundary loads next page',async()=>{
 const r=await preview(1001,Array.from({length:1000},(_,i)=>i+1));
 assert.equal(r.body.audience.pending,1);
});
test('history failure does not return a misleading send audience',async()=>{
 const r=await preview(1338,Array.from({length:1338},(_,i)=>i+1),true);
 assert.equal(r.status,500); assert.equal(r.body.success,false);
});
