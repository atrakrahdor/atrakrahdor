(function(){
    function renderAtrakHomeNewsCards(){
        const grid=document.getElementById('atrakHomeNewsTrack');
        if(!grid || typeof getAtrakNews!=='function') return;
        let news=[];
        try{ news=typeof sortAtrakNews==='function' ? sortAtrakNews(getAtrakNews()) : getAtrakNews(); }catch(e){ news=[]; }
        if(!Array.isArray(news)) news=[];
        if(!news.length){
            grid.innerHTML='<div class="atrak-home-news-empty">هنوز خبری منتشر نشده است.</div>';
            return;
        }
        grid.innerHTML=news.map(function(item){
            const esc=(v)=>typeof escapeAtrakNewsHTML==='function' ? escapeAtrakNewsHTML(v) : String(v??'');
            const img=esc(item.image || defaultImages.slide1);
            const title=esc(item.title || 'خبر مدرسه');
            const date=typeof formatAtrakNewsDate==='function' ? formatAtrakNewsDate(item.date) : (item.date||'');
            const id=esc(item.id || '');
            return `<article class="atrak-home-news-card" onclick="openAtrakNews('${id}')">
                <img src="${img}" alt="${title}" loading="lazy" onerror="this.src='${esc(defaultImages.slide1)}'" decoding="async">
                <div class="atrak-home-news-card-body">
                    <h3>${title}</h3>
                    <div class="atrak-home-news-date">${date}</div>
                    <div class="atrak-home-news-more">مشاهده خبر ←</div>
                </div>
            </article>`;
        }).join('');
    }
    window.renderAtrakHomeNewsCards=renderAtrakHomeNewsCards;

    if(typeof window.renderAtrakNews==='function'){
        const originalRender=window.renderAtrakNews;
        window.renderAtrakNews=function(){
            try{ originalRender.apply(this,arguments); }catch(e){ console.warn('اخبار اصلی:',e); }
            renderAtrakHomeNewsCards();
        };
    }

    function refresh(){
        renderAtrakHomeNewsCards();
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',refresh);
    else refresh();
    setTimeout(refresh,300);
    setTimeout(refresh,1200);
})();