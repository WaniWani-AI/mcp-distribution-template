import{a as e,i as t,s as n,t as r}from"./jsx-runtime-BBpOWWDn.js";var i=r(),a=n(e(),1),o=`
.sb-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}
.sb-modal-container {
  border-radius: 12px;
  position: fixed;
  inset: 0;
  margin: auto;
  width: fit-content;
  height: fit-content;
  background: white;
  z-index: 9999;
}
`;function s({children:e}){let n=t.getInstance(),{mode:r}=(0,a.useSyncExternalStore)(n.getHostContextStore(`view`).subscribe,n.getHostContextStore(`view`).getSnapshot),s=r===`modal`;return(0,a.useEffect)(()=>{if(!s)return;let e=e=>{e.key===`Escape`&&n.closeModal()};return document.addEventListener(`keydown`,e),()=>document.removeEventListener(`keydown`,e)},[s,n]),(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`style`,{children:o}),s&&(0,i.jsx)(`div`,{role:`dialog`,className:`sb-modal-backdrop`,onClick:e=>{e.target===e.currentTarget&&n.closeModal()}}),(0,i.jsx)(`div`,{className:s?`sb-modal-container`:void 0,children:e})]})}export{s as ModalProvider};