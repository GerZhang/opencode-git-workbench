"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const P=require("@opencode/plugin/gui"),a=require("effect"),Vt=require("node:child_process"),_t=require("node:fs/promises"),F=require("node:path"),e=require("solid-js/web"),s=require("solid-js"),Jt={"panel.title":"Git","command.open":"Open Git","menu.title":"Git","view.changes":"Changes","view.graph":"Graph","state.loading":"Loading…","state.notRepo":"Not a Git repository","state.notRepoHint":"Open a session in a Git worktree to use this panel.","state.desktopOnly":"The Git panel requires OpenCode Desktop.","state.clean":"Working tree clean","state.noCommits":"No commits yet","state.noDiff":"Select a file to see its diff.","state.noChanges":"No changes","state.error":"Git error","section.staged":"Staged ({{count}})","section.unstaged":"Changes ({{count}})","action.refresh":"Refresh","action.stageAll":"Stage all","action.unstageAll":"Unstage all","action.stage":"Stage {{path}}","action.unstage":"Unstage {{path}}","action.commit":"Commit","action.committing":"Committing…","action.closeDiff":"Close diff","action.loadMore":"Load more","action.amend":"Amend last commit","placeholder.message":"Commit message","hint.commit":"Cmd/Ctrl+Enter to commit","label.allBranches":"All branches","label.commits":"{{count}} commits","label.detached":"Detached HEAD","label.binary":"Binary file","label.truncated":"Diff truncated","notice.committed":"Committed {{hash}}","error.messageRequired":"Write a commit message first.","time.justNow":"just now","time.minutes":"{{count}}m ago","time.hours":"{{count}}h ago","time.days":"{{count}}d ago"},ft={"panel.title":"Git","command.open":"打开 Git","menu.title":"Git","view.changes":"变更","view.graph":"历史","state.loading":"加载中…","state.notRepo":"不是 Git 仓库","state.notRepoHint":"请在一个 Git 工作区的会话中使用此面板。","state.desktopOnly":"Git 面板需要 OpenCode Desktop。","state.clean":"工作区没有未提交的变更","state.noCommits":"还没有提交","state.noDiff":"选择文件查看差异。","state.noChanges":"没有变更","state.error":"Git 错误","section.staged":"已暂存 ({{count}})","section.unstaged":"变更 ({{count}})","action.refresh":"刷新","action.stageAll":"全部暂存","action.unstageAll":"全部取消暂存","action.stage":"暂存 {{path}}","action.unstage":"取消暂存 {{path}}","action.commit":"提交","action.committing":"提交中…","action.closeDiff":"关闭差异","action.loadMore":"加载更多","action.amend":"修补上一次提交","placeholder.message":"提交信息","hint.commit":"Cmd/Ctrl+Enter 提交","label.allBranches":"所有分支","label.commits":"{{count}} 个提交","label.detached":"游离 HEAD","label.binary":"二进制文件","label.truncated":"差异已截断","notice.committed":"已提交 {{hash}}","error.messageRequired":"请先填写提交信息。","time.justNow":"刚刚","time.minutes":"{{count}} 分钟前","time.hours":"{{count}} 小时前","time.days":"{{count}} 天前"},Yt=P.Plugin.define({i18n:{en:Jt,zh:ft,"zh-CN":ft,"zh-Hans":ft}}),Qt=a.Schema.Struct({root:a.Schema.String,branch:a.Schema.String,detached:a.Schema.Boolean,head:a.Schema.NullOr(a.Schema.String)}),Zt=a.Schema.Struct({path:a.Schema.String,oldPath:a.Schema.optional(a.Schema.String),index:a.Schema.String,worktree:a.Schema.String,untracked:a.Schema.Boolean,conflicted:a.Schema.Boolean}),te=a.Schema.Struct({hash:a.Schema.String,shortHash:a.Schema.String,parents:a.Schema.Array(a.Schema.String),author:a.Schema.String,email:a.Schema.String,timestamp:a.Schema.Number,refs:a.Schema.Array(a.Schema.String),subject:a.Schema.String,lane:a.Schema.Number,before:a.Schema.Array(a.Schema.Number),after:a.Schema.Array(a.Schema.Number),parentLanes:a.Schema.Array(a.Schema.Number)}),ee=a.Schema.Struct({repo:a.Schema.NullOr(Qt),files:a.Schema.Array(Zt),commits:a.Schema.Array(te),maxLanes:a.Schema.Number,hasMore:a.Schema.Boolean}),ne=a.Schema.Struct({text:a.Schema.String,truncated:a.Schema.Boolean,binary:a.Schema.Boolean}),ie=a.Schema.Struct({hash:a.Schema.String,subject:a.Schema.String}),Gt=P.Ipc.define({id:"opencode-git-workbench.git",methods:{snapshot:{input:a.Schema.Struct({directory:a.Schema.String,allBranches:a.Schema.Boolean,limit:a.Schema.Number}),output:ee},diff:{input:a.Schema.Struct({directory:a.Schema.String,path:a.Schema.String,oldPath:a.Schema.optional(a.Schema.String),staged:a.Schema.Boolean,untracked:a.Schema.Boolean}),output:ne},stage:{input:a.Schema.Struct({directory:a.Schema.String,paths:a.Schema.Array(a.Schema.String)})},unstage:{input:a.Schema.Struct({directory:a.Schema.String,paths:a.Schema.Array(a.Schema.String)})},commit:{input:a.Schema.Struct({directory:a.Schema.String,message:a.Schema.String,amend:a.Schema.Boolean}),output:ie}}});function oe(t){let n=[];const i=[];let o=0;for(const l of t){const c=n.slice();let r=c.indexOf(l.hash);if(r===-1){const p=c.indexOf(null);p===-1?(r=c.length,c.push(l.hash)):(r=p,c[r]=l.hash)}const m=c.slice();m[r]=null;const g=[];for(let p=0;p<l.parents.length;p+=1){const k=l.parents[p];let y=m.indexOf(k);y===-1&&(p===0&&m[r]===null?y=r:(y=m.indexOf(null,r+1),y===-1&&(y=m.indexOf(null)),y===-1&&(y=m.length,m.push(null))),m[y]=k),g.push(y)}const h=At(c),w=At(m);i.push({...l,lane:r,before:h,after:w,parentLanes:g});for(const p of[...h,...w,r,...g])o=Math.max(o,p+1);for(n=m;n.length>0&&n[n.length-1]===null;)n.pop()}return{rows:i,maxLanes:o}}function At(t){const n=[];for(let i=0;i<t.length;i+=1)t[i]!==null&&n.push(i);return n}const Tt=2e4,re=12e4,ae=16*1024*1024,Mt=25e4,xt=3e3,ce=1e6,se="%H%x00%P%x00%an%x00%ae%x00%at%x00%D%x00%s%x1e";function le(){return{...process.env,GIT_TERMINAL_PROMPT:"0",GIT_PAGER:"cat",GIT_OPTIONAL_LOCKS:"0",LC_ALL:"C"}}async function de(t){const n=await Ft(t.directory);if(!n)return{repo:null,files:[],commits:[],maxLanes:0,hasMore:!1};const i=Math.max(1,Math.min(Math.trunc(t.limit)||120,500)),[o,l,c]=await Promise.all([fe(n),nt(n,["status","--porcelain=v1","-z","--untracked-files=all"]),pe(n,t.allBranches,i)]),r=be(l),m=oe(c.commits);return{repo:{root:n,...o},files:r,commits:m.rows,maxLanes:m.maxLanes,hasMore:c.hasMore}}async function ue(t){const n=await lt(t.directory),i=st(n,t.path);if(t.untracked)return xe(n,i);const o=["diff","--no-color","--no-ext-diff","--unified=3"];t.staged&&o.push("--cached");const l=[...new Set([t.path,t.oldPath].filter(r=>!!r).map(r=>st(n,r)))];o.push("--",...l);const c=await z(n,o);if(c.code!==0)throw it(o,c);return ve(c.stdout)}async function ge(t){if(t.paths.length===0)return;const n=await lt(t.directory),i=t.paths.map(o=>st(n,o));await nt(n,["add","-A","--",...i])}async function me(t){if(t.paths.length===0)return;const n=await lt(t.directory),i=t.paths.map(r=>st(n,r)),o=await z(n,["restore","--staged","--",...i]);if(o.code===0)return;if((await z(n,["rev-parse","--verify","HEAD"])).code===0)throw it(["restore","--staged","--",...i],o);if((await z(n,["rm","--cached","--ignore-unmatch","--",...i])).code!==0)throw it(["restore","--staged","--",...i],o)}async function he(t){const n=await lt(t.directory),i=t.message.trim();if(!i)throw new Error("Commit message is required");const o=["commit","-m",i];t.amend&&o.push("--amend"),await nt(n,o,re);const l=(await nt(n,["rev-parse","--short","HEAD"])).trim(),c=(await nt(n,["log","-1","--pretty=%s"])).trim();return{hash:l,subject:c}}async function Ft(t){if(!t||!F.isAbsolute(t))return null;try{const n=await z(t,["rev-parse","--show-toplevel"]);if(n.code!==0)return null;const i=n.stdout.trim();return i?F.resolve(i):null}catch{return null}}async function lt(t){const n=await Ft(t);if(!n)throw new Error(`Not a Git repository: ${t}`);return n}async function fe(t){const n=await z(t,["rev-parse","--verify","HEAD"]),i=n.code===0?n.stdout.trim():null,o=await z(t,["symbolic-ref","--short","-q","HEAD"]);return o.code===0&&o.stdout.trim()?{branch:o.stdout.trim(),detached:!1,head:i}:{branch:i?i.slice(0,7):"HEAD",detached:!0,head:i}}async function pe(t,n,i){const o=await z(t,["rev-parse","--verify","HEAD"]);if(o.code!==0&&!n)return{commits:[],hasMore:!1};const l=["log","--topo-order",`--max-count=${i+1}`,"--decorate=short",`--pretty=format:${se}`];n?l.push("--exclude=refs/stash","--exclude=refs/notes/*","--all"):l.push("HEAD");const c=await z(t,l);if(c.code!==0){if(!n&&o.code!==0)return{commits:[],hasMore:!1};throw it(l,c)}const r=[];for(const g of c.stdout.split("")){const h=g.replace(/^\n+/,"").replace(/\n+$/,"");if(!h)continue;const w=h.split("\0");if(w.length<7)continue;const[p,k,y,D,R,H,U]=w;r.push({hash:p,shortHash:p.slice(0,7),parents:k?k.split(" ").filter(Boolean):[],author:y,email:D,timestamp:Number(R)||0,refs:H?H.split(", ").filter(Boolean):[],subject:U})}const m=r.length>i;return{commits:m?r.slice(0,i):r,hasMore:m}}function be(t){const n=t.split("\0"),i=[];for(let o=0;o<n.length;o+=1){const l=n[o];if(!l)continue;const c=l[0],r=l[1],m=l.slice(3);if(!m)continue;let g;(c==="R"||c==="C"||r==="R"||r==="C")&&(g=n[o+1],o+=1),i.push({path:m,oldPath:g,index:c,worktree:r,untracked:c==="?",conflicted:c==="U"||r==="U"||c==="A"&&r==="A"||c==="D"&&r==="D"})}return i}function st(t,n){if(!n||n.includes("\0"))throw new Error("Invalid path");const i=F.isAbsolute(n)?n:F.resolve(t,n),o=F.relative(t,i);if(!o||o===".."||o.startsWith(`..${F.sep}`)||F.isAbsolute(o))throw new Error("Path is outside the repository");return o.split(F.sep).join("/")}async function xe(t,n){const i=F.join(t,n),o=await _t.stat(i);if(!o.isFile())return{text:`Not a regular file: ${n}`,truncated:!1,binary:!1};if(o.size>ce)return{text:`File is too large to preview (${we(o.size)}).`,truncated:!0,binary:!1};const l=await _t.readFile(i);if(l.includes(0))return{text:`Binary file: ${n}`,truncated:!1,binary:!0};const r=l.toString("utf8").split(`
`).map(w=>w.endsWith("\r")?w.slice(0,-1):w);r.length>0&&r[r.length-1]===""&&r.pop();const m=r.slice(0,xt),g=r.length===0?"@@ -0,0 +0,0 @@":`@@ -0,0 +1,${r.length} @@`;return{text:[`diff --git a/${n} b/${n}`,"new file mode 100644","--- /dev/null",`+++ b/${n}`,g,...m.map(w=>`+${w}`)].join(`
`),truncated:r.length>m.length,binary:!1}}function ve(t){const n=/^Binary files .* differ$/m.test(t)||t.includes("\0");let i=t,o=!1;i.length>Mt&&(i=i.slice(0,Mt),o=!0);const l=i.split(`
`);return l.length>xt&&(i=l.slice(0,xt).join(`
`),o=!0),{text:i,truncated:o,binary:n}}function we(t){return t<1024?`${t} B`:t<1024*1024?`${(t/1024).toFixed(1)} KB`:`${(t/(1024*1024)).toFixed(1)} MB`}function z(t,n,i=Tt){return new Promise((o,l)=>{Vt.execFile("git",n,{cwd:t,env:le(),maxBuffer:ae,timeout:i,windowsHide:!0},(c,r,m)=>{if(!c){o({stdout:r,stderr:m,code:0});return}if(c.killed){l(new Error(`git ${n[0]} timed out after ${i}ms`));return}if(typeof c.code=="number"){o({stdout:r,stderr:m,code:c.code});return}l(c)})})}async function nt(t,n,i=Tt){const o=await z(t,n,i);if(o.code!==0)throw it(n,o);return o.stdout}function it(t,n){const i=(n.stderr||n.stdout).trim().slice(0,4e3);return new Error(i||`git ${t[0]??""} exited with code ${n.code}`)}const ye=t=>{t.provide(Gt,{snapshot:n=>de(n),diff:n=>ue(n),stage:n=>ge(n),unstage:n=>me(n),commit:n=>he(n)}),t.log.write("info","opencode-git-workbench ready",{version:t.app.version})};var Se=e.template('<div class="ocgit-banner error"><div class=ocgit-banner-text></div><button class=ocgit-icon-button type=button>×'),Ce=e.template('<div class="ocgit-banner notice"><div class=ocgit-banner-text></div><button class=ocgit-icon-button type=button>×'),$e=e.template("<div class=ocgit-panel><div class=ocgit-header><div class=ocgit-branch><span class=ocgit-branch-icon></span></div><button class=ocgit-icon-button type=button>↻</button></div><div class=ocgit-tabs><button type=button><span class=ocgit-tab-count></span></button><button type=button>"),Dt=e.template("<span class=ocgit-branch-name>"),ke=e.template("<span class=ocgit-detached>"),Et=e.template('<div class=ocgit-section><div class=ocgit-section-head><span></span><button class="ocgit-button subtle"type=button>'),_e=e.template('<div class=ocgit-changes><div class=ocgit-commit-box><textarea class=ocgit-message rows=3></textarea><div class=ocgit-commit-actions><label class=ocgit-check><input type=checkbox></label><button class="ocgit-button primary"type=button></button></div><div class=ocgit-note></div></div><div class=ocgit-changes-scroll>'),Ae=e.template("<div role=button tabindex=0><span></span><span class=ocgit-file-path></span><button class=ocgit-icon-button type=button>"),pt=e.template("<div class=ocgit-empty>"),Me=e.template("<div class=ocgit-diff><div class=ocgit-diff-head><span class=ocgit-diff-title></span><button class=ocgit-icon-button type=button>×"),De=e.template("<div class=ocgit-diff-body>"),Ee=e.template("<div class=ocgit-note>"),Le=e.template("<div>"),Pe=e.template("<div class=ocgit-graph-head><label class=ocgit-check><input type=checkbox></label><span class=ocgit-graph-count>"),Be=e.template("<button class=ocgit-load-more type=button>"),ze=e.template("<div class=ocgit-graph-scroll>"),Re=e.template('<span class="ocgit-ref more">+'),Ne=e.template("<div class=ocgit-commit-refs>"),Ge=e.template("<div class=ocgit-commit><div class=ocgit-graph-col><svg height=54 aria-hidden=true><circle cy=27 r=4.5 opacity=0.2></circle><circle cy=27 r=3.2 fill=none stroke-width=2></circle></svg></div><div class=ocgit-commit-info><div class=ocgit-commit-subject></div><div class=ocgit-commit-meta><span></span><span></span><span class=ocgit-mono>"),Te=e.template("<svg><line y1=0 stroke-width=1.5></svg>",!1,!0,!1),Lt=e.template("<svg><line y1=27 y2=54 stroke-width=1.5></svg>",!1,!0,!1),Fe=e.template("<svg><path fill=none stroke-width=1.5></svg>",!1,!0,!1),He=e.template("<span>"),Oe=e.template('<svg width=11 height=11 viewBox="0 0 16 16"fill=none stroke=currentColor stroke-width=1.5 stroke-linecap=round stroke-linejoin=round aria-hidden=true><circle cx=4 cy=3 r=1.6></circle><circle cx=4 cy=13 r=1.6></circle><circle cx=12 cy=6 r=1.6></circle><path d="M4 4.6v6.8"></path><path d="M12 7.6c0 2.2-2 3-4.5 3H4">'),je=e.template("<div class=ocgit-empty-hint>"),Ie=e.template("<div class=ocgit-empty><div class=ocgit-empty-title>");const Pt=["#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316"];function qe(t){const n=P.usePlugin(),i=n.main(Gt),o=()=>n.app.platform==="desktop",[l,c]=s.createSignal("changes"),[r,m]=s.createSignal(null),[g,h]=s.createSignal(!1),[w,p]=s.createSignal(null),[k,y]=s.createSignal(null),[D,R]=s.createSignal(!1),[H,U]=s.createSignal(120),[E,Z]=s.createSignal(null),[K,ot]=s.createSignal(""),[d,b]=s.createSignal(!1),[u,C]=s.createSignal(null),[A,$]=s.createSignal(null),[I,X]=s.createSignal(!1),[Ht,Ot]=s.createSignal(0);let rt=0,at=0,vt="";const q=s.createMemo(()=>r()?.files.filter(zt)??[]),V=s.createMemo(()=>r()?.files.filter(Rt)??[]),jt=s.createMemo(()=>new Set([...q(),...V()].map(f=>f.path)).size),It=s.createMemo(()=>r()?.repo??null),wt=async(f,_,M,ut=!0)=>{if(!o())return;const O=++rt;h(!0),ut&&p(null);try{const J=await i.snapshot({directory:f,allBranches:_,limit:M},{signal:n.signal});if(O!==rt)return;m(J);const N=u();N&&(J.files.some(W=>W.path===N.path&&(N.staged?zt(W):Rt(W)))||(C(null),$(null)))}catch(J){if(O!==rt||n.signal.aborted)return;p(bt(J))}finally{O===rt&&h(!1)}},qt=async f=>{const _=++at;if(!f||!o()){$(null),X(!1);return}X(!0);try{const M=await i.diff({directory:t.session.directory,path:f.path,oldPath:f.oldPath,staged:f.staged,untracked:f.untracked},{signal:n.signal});if(_!==at)return;$(M)}catch(M){if(_!==at||n.signal.aborted)return;$({text:bt(M),truncated:!1,binary:!1})}finally{_===at&&X(!1)}},yt=(f=!0)=>wt(t.session.directory,D(),H(),f),dt=async(f,_)=>{if(!E()){Z(f),p(null),y(null);try{await _()}catch(M){p(bt(M))}finally{await yt(!1),Ot(M=>M+1),Z(null)}}},St=f=>dt("stage",async()=>{await i.stage({directory:t.session.directory,paths:f},{signal:n.signal})}),Ct=f=>dt("unstage",async()=>{await i.unstage({directory:t.session.directory,paths:f},{signal:n.signal})}),Wt=()=>St(V().flatMap(ct)),Ut=()=>Ct(q().flatMap(ct)),$t=()=>dt("commit",async()=>{const f=K().trim();if(!f)throw new Error(n.t("error.messageRequired"));const _=await i.commit({directory:t.session.directory,message:f,amend:d()},{signal:n.signal});ot(""),b(!1),y(n.t("notice.committed",{hash:_.hash}))}),kt=(f,_)=>{$(null),C({path:f.path,oldPath:f.oldPath,staged:_,untracked:f.untracked&&!_})};return s.createEffect(()=>{const f=t.session.directory,_=D(),M=H();o()&&(f!==vt&&(vt=f,m(null),C(null),$(null)),wt(f,_,M))}),s.createEffect(()=>{Ht();const f=u();qt(f)}),(()=>{var f=$e(),_=f.firstChild,M=_.firstChild,ut=M.firstChild,O=M.nextSibling,J=_.nextSibling,N=J.firstChild,gt=N.firstChild,W=N.nextSibling;return e.insert(ut,e.createComponent(Xe,{})),e.insert(M,e.createComponent(s.Show,{get when(){return It()},get fallback(){return(()=>{var v=Dt();return e.insert(v,()=>n.t("panel.title")),v})()},children:v=>[(()=>{var S=Dt();return e.insert(S,()=>v().branch),e.effect(()=>e.setAttribute(S,"title",v().root)),S})(),e.createComponent(s.Show,{get when(){return v().detached},get children(){var S=ke();return e.insert(S,()=>n.t("label.detached")),S}})]}),null),O.$$click=()=>{yt()},N.$$click=()=>c("changes"),e.insert(N,()=>n.t("view.changes"),gt),e.insert(gt,jt),W.$$click=()=>c("graph"),e.insert(W,()=>n.t("view.graph")),e.insert(f,e.createComponent(s.Show,{get when(){return w()},get children(){var v=Se(),S=v.firstChild,G=S.nextSibling;return e.insert(S,w),G.$$click=()=>p(null),v}}),null),e.insert(f,e.createComponent(s.Show,{get when(){return k()},get children(){var v=Ce(),S=v.firstChild,G=S.nextSibling;return e.insert(S,k),G.$$click=()=>y(null),v}}),null),e.insert(f,e.createComponent(s.Show,{get when(){return o()},get fallback(){return e.createComponent(et,{get title(){return n.t("state.desktopOnly")}})},get children(){return e.createComponent(s.Show,{get when(){return r()},get fallback(){return e.createComponent(et,{get title(){return e.memo(()=>!!w())()?n.t("state.error"):n.t("state.loading")}})},children:v=>e.createComponent(s.Show,{get when(){return v().repo},get fallback(){return e.createComponent(et,{get title(){return n.t("state.notRepo")},get hint(){return n.t("state.notRepoHint")}})},get children(){return e.createComponent(s.Show,{get when(){return l()==="changes"},get fallback(){return e.createComponent(Ue,{get commits(){return v().commits},get maxLanes(){return v().maxLanes},get hasMore(){return v().hasMore},get allBranches(){return D()},onAllBranches:R,onLoadMore:()=>U(S=>S+120)})},get children(){var S=_e(),G=S.firstChild,T=G.firstChild,tt=T.nextSibling,Y=tt.firstChild,mt=Y.firstChild,ht=Y.nextSibling,Kt=tt.nextSibling,Xt=G.nextSibling;return T.$$keydown=x=>{x.isComposing||(x.metaKey||x.ctrlKey)&&x.key==="Enter"&&(x.preventDefault(),$t())},T.$$input=x=>ot(x.currentTarget.value),mt.addEventListener("change",x=>b(x.currentTarget.checked)),e.insert(Y,()=>n.t("action.amend"),null),ht.$$click=()=>{$t()},e.insert(ht,(()=>{var x=e.memo(()=>E()==="commit");return()=>x()?n.t("action.committing"):n.t("action.commit")})()),e.insert(Kt,()=>n.t("hint.commit")),e.insert(Xt,e.createComponent(s.Show,{get when(){return q().length>0||V().length>0},get fallback(){return e.createComponent(et,{get title(){return n.t("state.clean")}})},get children(){return[e.createComponent(s.Show,{get when(){return q().length>0},get children(){var x=Et(),Q=x.firstChild,j=Q.firstChild,B=j.nextSibling;return e.insert(j,()=>n.t("section.staged",{count:q().length})),B.$$click=()=>{Ut()},e.insert(B,()=>n.t("action.unstageAll")),e.insert(x,e.createComponent(s.For,{get each(){return q()},children:L=>e.createComponent(Bt,{file:L,staged:!0,get busy(){return!!E()},get selected(){return Nt(u(),L,!0)},onSelect:()=>kt(L,!0),onToggle:()=>{Ct(ct(L))}})}),null),e.effect(()=>B.disabled=!!E()),x}}),e.createComponent(s.Show,{get when(){return V().length>0},get children(){var x=Et(),Q=x.firstChild,j=Q.firstChild,B=j.nextSibling;return e.insert(j,()=>n.t("section.unstaged",{count:V().length})),B.$$click=()=>{Wt()},e.insert(B,()=>n.t("action.stageAll")),e.insert(x,e.createComponent(s.For,{get each(){return V()},children:L=>e.createComponent(Bt,{file:L,staged:!1,get busy(){return!!E()},get selected(){return Nt(u(),L,!1)},onSelect:()=>kt(L,!1),onToggle:()=>{St(ct(L))}})}),null),e.effect(()=>B.disabled=!!E()),x}})]}})),e.insert(S,e.createComponent(s.Show,{get when(){return u()},children:x=>e.createComponent(We,{get target(){return x()},get diff(){return A()},get loading(){return I()},onClose:()=>C(null)})}),null),e.effect(x=>{var Q=n.t("placeholder.message"),j=!!E(),B=!!E(),L=!!E()||!K().trim()||q().length===0&&!d();return Q!==x.e&&e.setAttribute(T,"placeholder",x.e=Q),j!==x.t&&(T.disabled=x.t=j),B!==x.a&&(mt.disabled=x.a=B),L!==x.o&&(ht.disabled=x.o=L),x},{e:void 0,t:void 0,a:void 0,o:void 0}),e.effect(()=>T.value=K()),e.effect(()=>mt.checked=d()),S}})}})})}}),null),e.effect(v=>{var S=n.t("action.refresh"),G=n.t("action.refresh"),T=!o()||g()||!!E(),tt=`ocgit-tab${l()==="changes"?" active":""}`,Y=`ocgit-tab${l()==="graph"?" active":""}`;return S!==v.e&&e.setAttribute(O,"title",v.e=S),G!==v.t&&e.setAttribute(O,"aria-label",v.t=G),T!==v.a&&(O.disabled=v.a=T),tt!==v.o&&e.className(N,v.o=tt),Y!==v.i&&e.className(W,v.i=Y),v},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),f})()}function Bt(t){const n=P.usePlugin(),i=()=>t.file.untracked?"?":t.staged?t.file.index:t.file.worktree,o=()=>i()===" "?"M":i(),l=()=>t.file.oldPath?`${t.file.oldPath} → ${t.file.path}`:t.file.path;return(()=>{var c=Ae(),r=c.firstChild,m=r.nextSibling,g=m.nextSibling;return c.$$keydown=h=>{(h.key==="Enter"||h.key===" ")&&(h.preventDefault(),t.onSelect())},e.addEventListener(c,"click",t.onSelect,!0),e.insert(r,o),e.insert(m,()=>t.file.path),g.$$click=h=>{h.stopPropagation(),t.onToggle()},e.insert(g,()=>t.staged?"−":"+"),e.effect(h=>{var w=`ocgit-file${t.selected?" selected":""}`,p=l(),k=`ocgit-status ${Ve(o())}`,y=t.busy,D=n.t(t.staged?"action.unstage":"action.stage",{path:t.file.path}),R=n.t(t.staged?"action.unstage":"action.stage",{path:t.file.path});return w!==h.e&&e.className(c,h.e=w),p!==h.t&&e.setAttribute(c,"title",h.t=p),k!==h.a&&e.className(r,h.a=k),y!==h.o&&(g.disabled=h.o=y),D!==h.i&&e.setAttribute(g,"title",h.i=D),R!==h.n&&e.setAttribute(g,"aria-label",h.n=R),h},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0}),c})()}function We(t){const n=P.usePlugin(),i=()=>t.diff?.text??"",o=()=>t.target.oldPath?`${t.target.oldPath} → ${t.target.path}`:t.target.path;return(()=>{var l=Me(),c=l.firstChild,r=c.firstChild,m=r.nextSibling;return e.insert(r,o),e.addEventListener(m,"click",t.onClose,!0),e.insert(l,e.createComponent(s.Show,{get when(){return!t.loading},get fallback(){return(()=>{var g=pt();return e.insert(g,()=>n.t("state.loading")),g})()},get children(){return e.createComponent(s.Show,{get when(){return t.diff?.binary},get fallback(){return e.createComponent(s.Show,{get when(){return i()},get fallback(){return(()=>{var g=pt();return e.insert(g,()=>n.t("state.noDiff")),g})()},get children(){return[(()=>{var g=De();return e.insert(g,e.createComponent(s.Index,{get each(){return i().split(`
`)},children:h=>(()=>{var w=Le();return e.insert(w,()=>h()||" "),e.effect(()=>e.className(w,Je(h()))),w})()})),g})(),e.createComponent(s.Show,{get when(){return t.diff?.truncated},get children(){var g=Ee();return e.insert(g,()=>n.t("label.truncated")),g}})]}})},get children(){var g=pt();return e.insert(g,()=>n.t("label.binary")),g}})}}),null),e.effect(g=>{var h=t.target.path,w=n.t("action.closeDiff"),p=n.t("action.closeDiff");return h!==g.e&&e.setAttribute(r,"title",g.e=h),w!==g.t&&e.setAttribute(m,"title",g.t=w),p!==g.a&&e.setAttribute(m,"aria-label",g.a=p),g},{e:void 0,t:void 0,a:void 0}),l})()}function Ue(t){const n=P.usePlugin();return[(()=>{var i=Pe(),o=i.firstChild,l=o.firstChild,c=o.nextSibling;return l.addEventListener("change",r=>t.onAllBranches(r.currentTarget.checked)),e.insert(o,()=>n.t("label.allBranches"),null),e.insert(c,()=>n.t("label.commits",{count:t.commits.length})),e.effect(()=>l.checked=t.allBranches),i})(),(()=>{var i=ze();return e.insert(i,e.createComponent(s.Show,{get when(){return t.commits.length>0},get fallback(){return e.createComponent(et,{get title(){return n.t("state.noCommits")}})},get children(){return e.createComponent(s.For,{get each(){return t.commits},children:o=>e.createComponent(Ke,{commit:o,get maxLanes(){return t.maxLanes}})})}}),null),e.insert(i,e.createComponent(s.Show,{get when(){return t.hasMore},get children(){var o=Be();return e.addEventListener(o,"click",t.onLoadMore,!0),e.insert(o,()=>n.t("action.loadMore")),o}}),null),i})()]}function Ke(t){const n=P.usePlugin(),i=54,o=27,l=()=>t.maxLanes>12?Math.max(4,Math.floor(132/t.maxLanes)):12,c=()=>Math.max(24,t.maxLanes*l()+16),r=p=>8+p*l(),m=p=>Pt[p%Pt.length],g=s.createMemo(()=>[...new Set([...t.commit.before,...t.commit.after,t.commit.lane,...t.commit.parentLanes])].sort((k,y)=>k-y)),h=()=>Ze(t.commit.timestamp,n),w=()=>new Date(t.commit.timestamp*1e3).toLocaleString();return(()=>{var p=Ge(),k=p.firstChild,y=k.firstChild,D=y.firstChild,R=D.nextSibling,H=k.nextSibling,U=H.firstChild,E=U.nextSibling,Z=E.firstChild,K=Z.nextSibling,ot=K.nextSibling;return e.insert(y,e.createComponent(s.For,{get each(){return g()},children:d=>[e.createComponent(s.Show,{get when(){return t.commit.before.includes(d)},get children(){var b=Te();return e.effect(u=>{var C=r(d),A=r(d),$=d===t.commit.lane||!t.commit.after.includes(d)?o:i,I=m(d);return C!==u.e&&e.setAttribute(b,"x1",u.e=C),A!==u.t&&e.setAttribute(b,"x2",u.t=A),$!==u.a&&e.setAttribute(b,"y2",u.a=$),I!==u.o&&e.setAttribute(b,"stroke",u.o=I),u},{e:void 0,t:void 0,a:void 0,o:void 0}),b}}),e.createComponent(s.Show,{get when(){return e.memo(()=>d===t.commit.lane)()&&t.commit.after.includes(d)},get children(){var b=Lt();return e.effect(u=>{var C=r(d),A=r(d),$=m(d);return C!==u.e&&e.setAttribute(b,"x1",u.e=C),A!==u.t&&e.setAttribute(b,"x2",u.t=A),$!==u.a&&e.setAttribute(b,"stroke",u.a=$),u},{e:void 0,t:void 0,a:void 0}),b}}),e.createComponent(s.Show,{get when(){return e.memo(()=>!!(!t.commit.before.includes(d)&&t.commit.after.includes(d)&&d!==t.commit.lane))()&&!t.commit.parentLanes.includes(d)},get children(){var b=Lt();return e.effect(u=>{var C=r(d),A=r(d),$=m(d);return C!==u.e&&e.setAttribute(b,"x1",u.e=C),A!==u.t&&e.setAttribute(b,"x2",u.t=A),$!==u.a&&e.setAttribute(b,"stroke",u.a=$),u},{e:void 0,t:void 0,a:void 0}),b}})]}),D),e.insert(y,e.createComponent(s.For,{get each(){return t.commit.parentLanes},children:d=>e.createComponent(s.Show,{get when(){return d!==t.commit.lane},get children(){var b=Fe();return e.effect(u=>{var C=`M ${r(t.commit.lane)} ${o} C ${r(t.commit.lane)} ${o+12}, ${r(d)} ${i-12}, ${r(d)} ${i}`,A=m(d);return C!==u.e&&e.setAttribute(b,"d",u.e=C),A!==u.t&&e.setAttribute(b,"stroke",u.t=A),u},{e:void 0,t:void 0}),b}})}),D),e.insert(U,()=>t.commit.subject||"(no subject)"),e.insert(H,e.createComponent(s.Show,{get when(){return t.commit.refs.length>0},get children(){var d=Ne();return e.insert(d,e.createComponent(s.For,{get each(){return t.commit.refs.slice(0,4)},children:b=>(()=>{var u=He();return e.insert(u,()=>Qe(b)),e.effect(()=>e.className(u,`ocgit-ref ${Ye(b)}`)),u})()}),null),e.insert(d,e.createComponent(s.Show,{get when(){return t.commit.refs.length>4},get children(){var b=Re();return b.firstChild,e.insert(b,()=>t.commit.refs.length-4,null),b}}),null),d}}),E),e.insert(Z,()=>t.commit.author),e.insert(K,h),e.insert(ot,()=>t.commit.shortHash),e.effect(d=>{var b=`${t.commit.subject}
${t.commit.hash}
${t.commit.author} <${t.commit.email}>
${w()}`,u=`${c()}px`,C=c(),A=r(t.commit.lane),$=m(t.commit.lane),I=r(t.commit.lane),X=m(t.commit.lane);return b!==d.e&&e.setAttribute(p,"title",d.e=b),u!==d.t&&e.setStyleProperty(k,"width",d.t=u),C!==d.a&&e.setAttribute(y,"width",d.a=C),A!==d.o&&e.setAttribute(D,"cx",d.o=A),$!==d.i&&e.setAttribute(D,"fill",d.i=$),I!==d.n&&e.setAttribute(R,"cx",d.n=I),X!==d.s&&e.setAttribute(R,"stroke",d.s=X),d},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),p})()}function Xe(){return Oe()}function et(t){return(()=>{var n=Ie(),i=n.firstChild;return e.insert(i,()=>t.title),e.insert(n,e.createComponent(s.Show,{get when(){return t.hint},get children(){var o=je();return e.insert(o,()=>t.hint),o}}),null),n})()}function zt(t){return!t.untracked&&t.index!==" "&&t.index!=="?"}function Rt(t){return t.untracked||t.worktree!==" "&&t.worktree!=="?"}function Nt(t,n,i){return t?.path===n.path&&t.staged===i}function ct(t){return t.oldPath?[t.oldPath,t.path]:[t.path]}function Ve(t){switch(t){case"A":return"add";case"D":return"del";case"R":case"C":return"rename";case"U":return"conflict";case"?":return"untracked";default:return"mod"}}function Je(t){return t.startsWith("+++")||t.startsWith("---")||t.startsWith("diff ")?"ocgit-diff-line meta":t.startsWith("@@")?"ocgit-diff-line hunk":t.startsWith("+")?"ocgit-diff-line add":t.startsWith("-")?"ocgit-diff-line del":"ocgit-diff-line"}function Ye(t){return t==="HEAD"||t.startsWith("HEAD -> ")?"head":t.startsWith("tag: ")?"tag":/^(origin|upstream)\//.test(t)?"remote":"branch"}function Qe(t){return t.startsWith("tag: ")?t.slice(5):t.startsWith("HEAD -> ")?"HEAD":t}function Ze(t,n){const i=Math.max(0,Math.floor(Date.now()/1e3)-t);if(i<60)return n.t("time.justNow");const o=Math.floor(i/60);if(o<60)return n.t("time.minutes",{count:o});const l=Math.floor(o/60);if(l<24)return n.t("time.hours",{count:l});const c=Math.floor(l/24);return c<30?n.t("time.days",{count:c}):new Date(t*1e3).toLocaleDateString()}function bt(t){return t instanceof Error?t.message:String(t)}e.delegateEvents(["click","input","keydown"]);const tn=`
.ocgit-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: inherit;
  font-size: 12px;
  line-height: 1.45;
}

.ocgit-panel *,
.ocgit-panel *::before,
.ocgit-panel *::after {
  box-sizing: border-box;
}

.ocgit-panel button,
.ocgit-panel input,
.ocgit-panel textarea {
  font: inherit;
  color: inherit;
}

.ocgit-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

.ocgit-branch {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1;
  font-weight: 600;
}

.ocgit-branch-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: color-mix(in srgb, currentColor 8%, transparent);
  font-size: 11px;
  opacity: 0.75;
  flex: none;
}

.ocgit-branch-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocgit-detached {
  flex: none;
  font-size: 9px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 999px;
  color: #d97706;
  background: color-mix(in srgb, #d97706 13%, transparent);
}

.ocgit-icon-button {
  appearance: none;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  background: color-mix(in srgb, currentColor 4%, transparent);
  border-radius: 5px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex: none;
  opacity: 0.8;
}

.ocgit-icon-button:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 11%, transparent);
  opacity: 1;
}

.ocgit-icon-button:disabled {
  opacity: 0.35;
  cursor: default;
}

.ocgit-tabs {
  display: flex;
  gap: 2px;
  padding: 4px 10px 0;
  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  flex: none;
}

.ocgit-tab {
  appearance: none;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: inherit;
  opacity: 0.55;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
}

.ocgit-tab:hover {
  opacity: 0.8;
}

.ocgit-tab.active {
  opacity: 1;
  border-bottom-color: #2563eb;
}

.ocgit-tab-count {
  opacity: 0.6;
  margin-left: 3px;
  font-variant-numeric: tabular-nums;
}

.ocgit-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  font-size: 11px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  flex: none;
}

.ocgit-banner.error {
  background: color-mix(in srgb, #dc2626 10%, transparent);
}

.ocgit-banner.notice {
  background: color-mix(in srgb, #16a34a 10%, transparent);
}

.ocgit-banner-text {
  min-width: 0;
  flex: 1;
  max-height: 120px;
  overflow: auto;
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.ocgit-changes {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.ocgit-commit-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  flex: none;
}

.ocgit-message {
  width: 100%;
  min-height: 56px;
  max-height: 140px;
  resize: vertical;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  background: color-mix(in srgb, currentColor 3%, transparent);
  padding: 6px 8px;
  font-size: 11px;
  line-height: 1.5;
  outline: none;
}

.ocgit-message:focus {
  border-color: color-mix(in srgb, #2563eb 55%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, #2563eb 15%, transparent);
}

.ocgit-message::placeholder {
  color: inherit;
  opacity: 0.4;
}

.ocgit-commit-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ocgit-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  opacity: 0.7;
  cursor: pointer;
  min-width: 0;
}

.ocgit-check input {
  margin: 0;
  width: 12px;
  height: 12px;
  accent-color: #2563eb;
}

.ocgit-button {
  appearance: none;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  background: color-mix(in srgb, currentColor 5%, transparent);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.ocgit-button:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.ocgit-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.ocgit-button.primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.ocgit-button.primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.ocgit-button.subtle {
  border-color: transparent;
  background: transparent;
  opacity: 0.6;
  padding: 2px 5px;
}

.ocgit-button.subtle:hover:not(:disabled) {
  opacity: 1;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.ocgit-changes-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.ocgit-section {
  border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
}

.ocgit-section:last-child {
  border-bottom: none;
}

.ocgit-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  opacity: 0.62;
}

.ocgit-section-head > span:first-child {
  flex: 1;
}

.ocgit-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  cursor: pointer;
  outline: none;
  min-width: 0;
}

.ocgit-file:hover,
.ocgit-file:focus-visible {
  background: color-mix(in srgb, currentColor 6%, transparent);
}

.ocgit-file.selected {
  background: color-mix(in srgb, #2563eb 12%, transparent);
}

.ocgit-status {
  width: 15px;
  flex: none;
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 9px;
  font-weight: 700;
  border-radius: 3px;
  padding: 1px 0;
  background: color-mix(in srgb, currentColor 7%, transparent);
}

.ocgit-status.mod {
  color: #d97706;
}

.ocgit-status.add {
  color: #16a34a;
}

.ocgit-status.del {
  color: #dc2626;
}

.ocgit-status.rename {
  color: #2563eb;
}

.ocgit-status.conflict {
  color: #dc2626;
  background: color-mix(in srgb, #dc2626 12%, transparent);
}

.ocgit-status.untracked {
  color: #6b7280;
}

.ocgit-file-path {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.ocgit-file-old {
  opacity: 0.5;
  font-size: 10px;
}

.ocgit-empty {
  padding: 18px 14px;
  text-align: center;
  font-size: 11px;
  opacity: 0.55;
  line-height: 1.6;
}

.ocgit-empty-title {
  font-weight: 600;
  opacity: 1;
  margin-bottom: 3px;
}

.ocgit-empty-hint {
  font-size: 10px;
  opacity: 0.75;
  overflow-wrap: anywhere;
}

.ocgit-diff {
  display: flex;
  flex-direction: column;
  min-height: 100px;
  max-height: 46%;
  border-top: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  flex: none;
}

.ocgit-diff-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  flex: none;
}

.ocgit-diff-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  opacity: 0.72;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ocgit-diff-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  line-height: 1.5;
  padding: 3px 0;
}

.ocgit-diff-line {
  white-space: pre;
  padding: 0 10px;
  min-height: 1.5em;
}

.ocgit-diff-line.meta {
  opacity: 0.6;
}

.ocgit-diff-line.hunk {
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 8%, transparent);
}

.ocgit-diff-line.add {
  color: #16a34a;
  background: color-mix(in srgb, #16a34a 9%, transparent);
}

.ocgit-diff-line.del {
  color: #dc2626;
  background: color-mix(in srgb, #dc2626 8%, transparent);
}

.ocgit-note {
  padding: 3px 10px;
  font-size: 9px;
  opacity: 0.55;
}

.ocgit-graph-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  flex: none;
}

.ocgit-graph-count {
  margin-left: auto;
  font-size: 9px;
  opacity: 0.5;
}

.ocgit-graph-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.ocgit-commit {
  display: flex;
  gap: 4px;
  min-height: 54px;
  padding: 3px 8px 3px 2px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 6%, transparent);
}

.ocgit-commit:hover {
  background: color-mix(in srgb, currentColor 4%, transparent);
}

.ocgit-graph-col {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.ocgit-commit-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.ocgit-commit-subject {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 500;
}

.ocgit-commit-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 9px;
  opacity: 0.58;
}

.ocgit-commit-meta > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocgit-commit-meta > span:first-child {
  min-width: 0;
  flex: 0 1 auto;
}

.ocgit-commit-refs {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
  overflow: hidden;
  max-height: 15px;
}

.ocgit-ref {
  flex: none;
  font-size: 8px;
  line-height: 13px;
  padding: 0 4px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  white-space: nowrap;
}

.ocgit-ref.head {
  color: #16a34a;
  border-color: color-mix(in srgb, #16a34a 35%, transparent);
  background: color-mix(in srgb, #16a34a 12%, transparent);
}

.ocgit-ref.branch {
  color: #2563eb;
  border-color: color-mix(in srgb, #2563eb 35%, transparent);
  background: color-mix(in srgb, #2563eb 12%, transparent);
}

.ocgit-ref.remote {
  color: #7c3aed;
  border-color: color-mix(in srgb, #7c3aed 35%, transparent);
  background: color-mix(in srgb, #7c3aed 12%, transparent);
}

.ocgit-ref.tag {
  color: #d97706;
  border-color: color-mix(in srgb, #d97706 35%, transparent);
  background: color-mix(in srgb, #d97706 12%, transparent);
}

.ocgit-ref.more {
  opacity: 0.55;
}

.ocgit-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ocgit-load-more {
  display: block;
  width: calc(100% - 20px);
  margin: 8px 10px;
  padding: 5px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, currentColor 4%, transparent);
  cursor: pointer;
  font-size: 10px;
}

.ocgit-load-more:hover {
  background: color-mix(in srgb, currentColor 9%, transparent);
}
`,en=t=>{t.add(P.Style,tn);const n={id:"git",get title(){return t.t("panel.title")},pinned:!0,closable:!1};t.add(P.Panel,{id:"git",region:"side",mobile:{get title(){return t.t("panel.title")},order:40,kind:"menu",icon:"branch"},list:()=>[n],render:i=>e.createComponent(qe,{get session(){return i.session}})}),t.add(P.Command,()=>({id:"open",title:t.t("command.open"),description:t.t("panel.title"),group:t.t("panel.title"),section:"session",enabled:!!t.sessions.current(),run:()=>{const i=t.sessions.current();i&&t.layout.open(`${t.id}:git`,i)}})),t.add(P.MenuItem,()=>{const i=t.sessions.current();return{menu:"session.panel",id:"git",title:t.t("menu.title"),icon:"branch",order:20,opened:!!i&&t.layout.state(`${t.id}:git`,i)!=="closed",run:()=>{const o=t.sessions.current();o&&t.layout.open(`${t.id}:git`,o)}}})},nn=P.Plugin.define({...Yt,setup:en,main:ye});exports.default=nn;
