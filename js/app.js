
const chars=['Luffy','Zoro','Sanji','Nami','Usopp','Chopper','Robin','Franky','Brook','Jinbe','Law','Ace'];
const roles=['Captain','Vice Captain','Tank','Healer','Support','Traitor'];
let pool=[],player=1;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const start=document.getElementById('startBtn');
const turn=document.getElementById('turn');
const card=document.getElementById('card');
const rolesDiv=document.getElementById('roles');
start.addEventListener('click',()=>{pool=shuffle([...chars]);start.style.display='none';next();});
function next(){
 if(pool.length===0){turn.textContent='Draft Complete';card.textContent='';rolesDiv.innerHTML='';return;}
 const ch=pool.shift();
 turn.textContent='Player '+player+' Turn';
 card.textContent='Draw: '+ch;
 rolesDiv.innerHTML='';
 roles.forEach(r=>{
  const b=document.createElement('button');
  b.className='role'; b.textContent=r;
  b.onclick=()=>{player=player===1?2:1;next();};
  rolesDiv.appendChild(b);
 });
}
