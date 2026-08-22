/* ===================================================================
   SUFI ILHAM — shared site script (engine + i18n + language + audio).
   Extracted from inline <script> blocks; downloaded once, then cached.
   Loaded with `defer`, so it runs after the document is parsed.
   =================================================================== */
/* ============ SUFI ILHAM — CINEMATIC ENGINE ============ */
(function(){
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- preloader ---- */
  function initPre(){
    var pre = document.getElementById('pre');
    if(!pre) return;
    var el = pre.querySelector('.pre-name');
    if(el){
      var txt = el.getAttribute('data-text') || el.textContent;
      el.textContent = '';
      txt.split('').forEach(function(ch,i){
        var s = document.createElement('span');
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        s.style.animationDelay = (i*0.055)+'s';
        el.appendChild(s);
      });
    }
    function hide(){ pre.classList.add('done'); document.body.style.overflow=''; }
    document.body.style.overflow='hidden';
    window.addEventListener('load', function(){ setTimeout(hide, RM?200:1750); });
    setTimeout(hide, 4200); // safety
  }

  /* ---- scroll progress + nav + to-top ---- */
  function initScroll(){
    var nav=document.getElementById('nav'), prog=document.getElementById('prog'), top=document.getElementById('totop');
    function on(){
      var y=window.scrollY, h=document.documentElement.scrollHeight-window.innerHeight;
      if(nav) nav.classList.toggle('solid', y>40);
      if(prog) prog.style.width = (h>0 ? (y/h*100) : 0)+'%';
      if(top) top.classList.toggle('show', y>600);
    }
    on(); window.addEventListener('scroll', on, {passive:true});
    if(top) top.addEventListener('click', function(){ window.scrollTo({top:0,behavior:RM?'auto':'smooth'}); });
  }

  /* ---- mobile menu ---- */
  function initMenu(){
    var b=document.getElementById('burger'), m=document.getElementById('menu');
    if(!b||!m) return;
    b.addEventListener('click', function(){ m.classList.toggle('open'); b.classList.toggle('open'); });
    m.addEventListener('click', function(e){
      if(e.target.tagName==='A'){ m.classList.remove('open'); b.classList.remove('open'); }
    });
  }

  /* ---- reveal ---- */
  function initReveal(){
    var els=document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window) || RM){
      els.forEach(function(e){e.classList.add('in');}); return;
    }
    var io=new IntersectionObserver(function(en){
      en.forEach(function(x){
        if(x.isIntersecting){
          var d = parseFloat(x.target.getAttribute('data-delay')||0);
          setTimeout(function(){ x.target.classList.add('in'); }, d);
          io.unobserve(x.target);
        }
      });
    },{threshold:.1, rootMargin:'0px 0px -70px 0px'});
    els.forEach(function(e){io.observe(e);});
  }

  /* ---- custom cursor ---- */
  function initCursor(){
    if(RM || window.matchMedia('(hover:none)').matches || window.innerWidth<900) return;
    var d=document.createElement('div'); d.className='cur';
    var r=document.createElement('div'); r.className='cur-r';
    document.body.appendChild(d); document.body.appendChild(r);
    var mx=-200,my=-200,rx=-200,ry=-200,seen=false;
    document.addEventListener('mousemove',function(e){
      mx=e.clientX; my=e.clientY;
      if(!seen){ seen=true; rx=mx; ry=my; d.classList.add('on'); r.classList.add('on'); }
      d.style.transform='translate3d('+(mx-3.5)+'px,'+(my-3.5)+'px,0)';
    });
    (function loop(){
      rx+=(mx-rx)*.16; ry+=(my-ry)*.16;
      r.style.transform='translate3d('+(rx-17)+'px,'+(ry-17)+'px,0)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a,button,.card,.tilt').forEach(function(el){
      el.addEventListener('mouseenter',function(){r.classList.add('big');});
      el.addEventListener('mouseleave',function(){r.classList.remove('big');});
    });
  }

  /* ---- particles ---- */
  function initParticles(){
    var c=document.getElementById('dust'); if(!c||RM) return;
    var ctx=c.getContext('2d'), ps=[], w,h,raf;
    function size(){
      var p=c.parentElement;
      w=c.width=p.offsetWidth; h=c.height=p.offsetHeight;
    }
    size();
    var n=Math.min(64, Math.round(w/22));
    for(var i=0;i<n;i++) ps.push({
      x:Math.random()*w, y:Math.random()*h,
      r:Math.random()*1.5+.35, s:Math.random()*.28+.06,
      o:Math.random()*.5+.12, dx:(Math.random()-.5)*.16
    });
    function draw(){
      ctx.clearRect(0,0,w,h);
      for(var i=0;i<ps.length;i++){
        var p=ps[i]; p.y-=p.s; p.x+=p.dx;
        if(p.y<-6){p.y=h+6;p.x=Math.random()*w;}
        if(p.x<-6)p.x=w+6; if(p.x>w+6)p.x=-6;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.2832);
        ctx.fillStyle='rgba(212,175,84,'+p.o+')'; ctx.fill();
      }
      raf=requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize',function(){cancelAnimationFrame(raf);size();draw();});
  }

  /* ---- maple falls snowfall ---- */
  function initSnow(){
    var sec=document.getElementById('maple'), c=document.getElementById('mfsnow');
    if(!sec||!c||RM) return;
    var ctx=c.getContext('2d');
    var ps=[], w=0,h=0,raf=null;
    var DPR=Math.min(2, window.devicePixelRatio||1);
    function size(){
      w=sec.offsetWidth; h=sec.offsetHeight;
      c.width=w*DPR; c.height=h*DPR;
      c.style.width=w+'px'; c.style.height=h+'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    function make(){
      var d=Math.random();                 /* depth: 0 = far, 1 = near */
      return {
        x:Math.random()*w, y:Math.random()*h,
        r:d*2.2+.7,                        /* near flakes are bigger    */
        s:d*.6+.22,                        /* ...and fall faster        */
        o:d*.42+.1,                        /* ...and shine brighter     */
        sw:d*10+2,                         /* sway amplitude            */
        ph:Math.random()*6.2832,           /* sway phase                */
        sp:Math.random()*.009+.004         /* sway speed                */
      };
    }
    function draw(){
      ctx.clearRect(0,0,w,h);
      for(var i=0;i<ps.length;i++){
        var p=ps[i];
        p.y+=p.s; p.ph+=p.sp;
        if(p.y>h+6){ p.y=-6; p.x=Math.random()*w; }
        ctx.beginPath();
        ctx.arc(p.x+Math.sin(p.ph)*p.sw, p.y, p.r, 0, 6.2832);
        ctx.fillStyle='rgba(236,242,252,'+p.o+')';
        ctx.fill();
      }
      raf=requestAnimationFrame(draw);
    }
    function start(){ if(!raf) draw(); }
    function stop(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
    size();
    var n=Math.min(120, Math.round(w/11));
    for(var i=0;i<n;i++) ps.push(make());
    /* draw only while the section is on screen */
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(en){
        en.forEach(function(x){ x.isIntersecting ? start() : stop(); });
      },{rootMargin:'90px'});
      io.observe(sec);
    } else start();
    window.addEventListener('resize',function(){
      size();
      for(var i=0;i<ps.length;i++){ ps[i].x=Math.random()*w; if(ps[i].y>h) ps[i].y=Math.random()*h; }
    });
  }

  /* ---- 3D tilt ---- */
  function initTilt(){
    if(RM || window.matchMedia('(hover:none)').matches) return;
    document.querySelectorAll('.tilt').forEach(function(el){
      var inner = el.querySelector('.tilt-in') || el;
      el.addEventListener('mousemove',function(e){
        var b=el.getBoundingClientRect();
        var px=(e.clientX-b.left)/b.width-.5, py=(e.clientY-b.top)/b.height-.5;
        var mx = parseFloat(el.getAttribute('data-max')||12);
        inner.style.transform='perspective(1100px) rotateY('+(px*mx)+'deg) rotateX('+(-py*mx)+'deg) translateZ(14px)';
      });
      el.addEventListener('mouseleave',function(){
        inner.style.transform='perspective(1100px) rotateY(0) rotateX(0) translateZ(0)';
      });
    });
  }

  /* ---- counters ---- */
  function initCount(){
    var els=document.querySelectorAll('[data-count]');
    if(!els.length) return;
    if(!('IntersectionObserver' in window)||RM){
      els.forEach(function(e){e.textContent=e.getAttribute('data-count');}); return;
    }
    var io=new IntersectionObserver(function(en){
      en.forEach(function(x){
        if(!x.isIntersecting) return;
        var el=x.target, raw=el.getAttribute('data-count');
        var target=parseFloat(raw.replace(/[^0-9.]/g,''));
        var suf=raw.replace(/[0-9.,]/g,'');
        var t0=null, dur=1500;
        function step(ts){
          if(!t0)t0=ts;
          var p=Math.min((ts-t0)/dur,1), e=1-Math.pow(1-p,3);
          var v=Math.floor(e*target);
          el.textContent=v.toLocaleString('en-US')+suf;
          if(p<1) requestAnimationFrame(step); else el.textContent=target.toLocaleString('en-US')+suf;
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    },{threshold:.5});
    els.forEach(function(e){io.observe(e);});
  }

  /* ---- parallax ---- */
  function initPara(){
    var els=document.querySelectorAll('[data-para]');
    if(!els.length||RM) return;
    var tick=false;
    function upd(){
      var vh=window.innerHeight;
      els.forEach(function(el){
        var b=el.getBoundingClientRect();
        if(b.bottom<-200||b.top>vh+200) return;
        var sp=parseFloat(el.getAttribute('data-para'));
        var off=((b.top+b.height/2)-vh/2)*sp*-0.1;
        el.style.transform='translate3d(0,'+off.toFixed(2)+'px,0)';
      });
      tick=false;
    }
    window.addEventListener('scroll',function(){
      if(!tick){requestAnimationFrame(upd);tick=true;}
    },{passive:true});
    upd();
  }

  /* ---- modal ---- */
  function initModal(){
    var mod=document.getElementById('modal'); if(!mod) return;
    var body=document.getElementById('modal-body'), last=null;
    function open(card){
      var d=JSON.parse(card.getAttribute('data-book'));
      var linksHtml = '';
      if(d.coming_soon){
        linksHtml =
          '<div class="m-links">'+
            (d.notify_url ? '<a class="btn btn-gold" href="'+d.notify_url+'" target="_blank" rel="noopener">Notify Me on WhatsApp <span class="arw">→</span></a>' : '')+
            (d.english_url ? '<a class="btn btn-ghost" href="'+d.english_url+'" target="_blank" rel="noopener">English Edition on Amazon <span class="arw">→</span></a>' : '')+
          '</div>'+
          (d.english_url ? (
            '<div class="m-stores">'+
              '<span class="m-stores-t">English Edition:</span>'+
              '<a href="'+d.english_url+'" target="_blank" rel="noopener">Amazon.in</a>'+
              (d.us ? '<a href="'+d.us+'" target="_blank" rel="noopener">Amazon.com</a>' : '')+
            '</div>'
          ) : '');
      } else if(d.custom_links && d.custom_links.length){
        linksHtml = '<div class="m-links">' + d.custom_links.map(function(l){
          return '<a class="btn '+(l.pri?'btn-gold':'btn-ghost')+'" href="'+l.url+'" target="_blank" rel="noopener">'+l.text+' <span class="arw">→</span></a>';
        }).join('') + '</div>';
      } else {
        linksHtml =
          '<div class="m-links">'+
            (d.us ? '<a class="btn btn-gold" href="'+d.us+'" target="_blank" rel="noopener">Amazon.com <span class="arw">→</span></a>' : '')+
            (d.in ? '<a class="btn btn-ghost" href="'+d.in+'" target="_blank" rel="noopener">Amazon.in</a>' : '')+
          '</div>'+
          ((d.uk || d.ca || d.au) ? (
            '<div class="m-stores">'+
              '<span class="m-stores-t">More stores:</span>'+
              (d.uk ? '<a href="'+d.uk+'" target="_blank" rel="noopener">Amazon.co.uk</a>' : '')+
              (d.ca ? '<a href="'+d.ca+'" target="_blank" rel="noopener">Amazon.ca</a>' : '')+
              (d.au ? '<a href="'+d.au+'" target="_blank" rel="noopener">Amazon.com.au</a>' : '')+
            '</div>'
          ) : '');
      }

      body.innerHTML =
        '<div class="m-grid">'+
          '<div class="m-cover"><img src="'+d.img+'" alt="'+d.title+' cover"></div>'+
          '<div class="m-body">'+
            '<div class="m-kick">'+d.kicker+'</div>'+
            '<h3>'+d.title+'</h3>'+
            (d.sub?'<div class="m-sub">'+d.sub+'</div>':'')+
            (d.quote?'<p class="m-quote">'+d.quote+'</p>':'')+
            '<div class="m-desc">'+d.desc+'</div>'+
            '<ul class="m-spec">'+(d.spec||[]).map(function(s){return '<li>'+s+'</li>';}).join('')+'</ul>'+
            linksHtml+
          '</div>'+
        '</div>';
      mod.classList.add('open');
      document.body.style.overflow='hidden';
      mod.setAttribute('aria-hidden','false');
      var cl = mod.querySelector('.m-close'); if(cl) cl.focus();
    }
    function close(){
      mod.classList.remove('open'); document.body.style.overflow='';
      mod.setAttribute('aria-hidden','true');
      if(last) last.focus();
    }
    document.querySelectorAll('[data-book]').forEach(function(card){
      card.querySelectorAll('.js-open').forEach(function(btn){
        btn.addEventListener('click',function(e){ e.preventDefault(); last=btn; open(card); });
      });
    });
    mod.addEventListener('click',function(e){
      if(e.target===mod || e.target.closest('.m-close')) close();
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape' && mod.classList.contains('open')) close();
    });
  }

  /* ---- filters ---- */
  function initFilter(){
    var btns=document.querySelectorAll('[data-filter]'); if(!btns.length) return;
    btns.forEach(function(b){
      b.addEventListener('click',function(){
        var f=b.getAttribute('data-filter');
        btns.forEach(function(x){x.classList.toggle('on',x===b);});
        document.querySelectorAll('[data-tags]').forEach(function(card){
          var show = f==='all' || card.getAttribute('data-tags').indexOf(f)>-1;
          card.style.display = show?'':'none';
          if(show){ card.classList.remove('in'); void card.offsetWidth; card.classList.add('in'); }
        });
      });
    });
  }

  /* ---- contact form (no backend: opens mail/WhatsApp) ---- */
  function initForm(){
    var f=document.getElementById('cform'); if(!f) return;
    var note=document.getElementById('fnote');
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var n=f.name.value.trim(), em=f.email.value.trim(), s=f.subject.value, m=f.message.value.trim();
      if(!n||!em||!m){ note.textContent='Please fill in your name, email and message.'; note.className='fnote err'; return; }
      var txt='Name: '+n+'%0AEmail: '+em+'%0ASubject: '+s+'%0A%0A'+encodeURIComponent(m);
      note.innerHTML='Opening WhatsApp… If nothing happens, message <b>+91 62017 57330</b> directly.';
      note.className='fnote ok';
      window.open('https://wa.me/916201757330?text='+txt,'_blank');
    });
  }

  /* ---- boot ---- */
  function boot(){
    initPre(); initScroll(); initMenu(); initReveal(); initCursor();
    initParticles(); initSnow(); initTilt(); initCount(); initPara(); initModal(); initFilter(); initForm();
    var y=document.getElementById('yr'); if(y) y.textContent=new Date().getFullYear();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


/* ============ LANGUAGE SYSTEM : EN / HI / UR / HINGLISH ============ */
window.I18N = {
en:{
 _name:'English', _dir:'ltr', _font:"var(--sans)",
 'nav.new':'New Release','nav.books':'Books','nav.themes':'Themes','nav.about':'About',
 'nav.contact':'Contact','nav.privacy':'Privacy','nav.store':'Amazon Store',
 'hero.eyebrow':'Sixteen Books · Philosophy, Self-Discovery, Fiction &amp; Romance',
 'hero.alias':'Also known as MD Naiyer Alam',
 'hero.lede':'An author and deep thinker exploring belief systems and self-discovery — writing that challenges societal norms and asks you to <strong>question every assumption you inherited.</strong>',
 'hero.lede2':'From the architecture of belief to the illusion of time, from ADHD and attention to the quiet freedom of simply seeing — five small-town love stories in Maple Falls, Vermont, and the literary novel The River\'s Portion. Sixteen books, one pursuit: the truth, however uncomfortable.',
 'hero.cta1':'Read the New Release','hero.cta2':'Browse All Books','hero.scroll':'Scroll',
 'stat.titles':'Published Titles','stat.pages':'Pages in Print',
 'stat.ku':'Free on Kindle Unlimited','stat.markets':'Amazon Marketplaces',
 'feat.tag':'The New Release','feat.head':'Your toaster came with a manual. <em>You didn\'t.</em>',
 'feat.sub':'A Systems-Based Guide to Designing a Better Mind, Better Habits, and a Better Life',
 'feat.quote':'"You are not broken. You are running old settings — and settings can be changed."',
 'feat.p1':'You are the most complex machine on the planet, and you were shipped with zero documentation. So you\'ve done what everyone does with an undocumented machine: pushed the same three buttons harder. More motivation. More discipline. More guilt.',
 'feat.p2':'Written in the calm, precise voice of a premium hardware manual — with <strong>111 original diagrams, 34 write-in worksheets and 10 complete system modules</strong> — it treats your life as what it actually is: a living system of energy, emotion, attention and habit.',
 'feat.m1':'Daily Operation','feat.m2':'Building &amp; Repair','feat.m3':'The Long Game',
 'feat.it':'No 4 a.m. alarms. No hype. No pretending Tuesday won\'t happen.<br>Stop gripping outcomes — start adjusting settings.',
 'feat.buy1':'Buy on Amazon.com','feat.buy2':'Buy on Amazon.in',
 'books.tag':'The Library','books.head':'All <em>Books</em>',
 'books.sub':'Every title by Sufi Ilham — in Kindle and paperback, worldwide on Amazon and upcoming special editions. Click any book to read more.',
 'f.all':'All Books','f.phil':'Philosophy','f.self':'Self-Help','f.ku':'Kindle Unlimited','f.pb':'Paperback','f.maple':'Maple Falls Romance',
 'card.more':'Read More','card.buy':'Amazon',
 'nav.maple':'Maple Falls','foot.maple':'Maple Falls Romance',
 'mf.tag':'The Maple Falls Romance Series',
 'mf.head':'Five love stories. <em>One town that never lets go.</em>',
 'mf.lede':'Some towns change your life. This one will steal your heart. Welcome to <strong>Maple Falls, Vermont</strong> &mdash; a small town at the end of a maple-lined street, where the bookshop keeps its lights on, the bakery keeps its ovens warm, and every love story gets the happily-ever-after it deserves.',
 'mf.lede2':'Grumpy sunshine. Enemies to lovers. Second chances. Snowdrifts. Fireworks. One town where everyone gets their ending &mdash; and all five books are free to read on Kindle Unlimited.',
 'mf.order':'Reading order','mf.note':'Start with Book 1, or jump in anywhere &mdash; Maple Falls will save you a seat.',
 'mf.cta1':'Start with Book 1','mf.cta2':'See the whole series on Amazon',
 'themes.tag':'Recurring Threads','themes.head':'What the work keeps <em>returning to</em>',
 'th1':'Belief','th1d':'The hidden architecture beneath your relationships, career and happiness — and the fact that architecture can be rebuilt.',
 'th2':'Time','th2d':'Why the obsession with past and future silently steals a life, and what remains when the clock loses its authority.',
 'th3':'Attention','th3d':'A thread one breath long. The whole art is the returning — in meditation, in focus, in ordinary Tuesday afternoons.',
 'th4':'Seeing','th4d':'Not doctrine, not self-help. Something older: philosophy with a heartbeat, offered without asking you to believe anything.',
 'quote.text':'The map is not the country. Walk until you know the difference.','quote.cite':'— The Map Is Finished',
 'about.tag':'About the Author','about.head':'A fearless pursuit <em>of truth</em>',
 'about.p1':'Sufi Ilham, also known as MD Naiyer Alam, is an author, deep thinker, and seeker of truth who explores belief, consciousness, identity, and self-discovery.',
 'about.p2':'&ldquo;Sufi Ilham&rdquo; is a name I gave myself. To me, it represents <strong>the meaning I live</strong> &mdash; a reminder that life is not merely something to exist through, but something to understand, question, and experience authentically.',
 'about.p3':'My writing challenges inherited beliefs and societal conditioning, inviting readers to question assumptions rather than accept them blindly. I explore the raw and often uncomfortable realities of existence, philosophy, human nature, and the search for truth.',
 'about.p4':'I believe authenticity begins when we dare to look beyond what we have been taught and discover what is genuinely our own.',
 'about.p5':'Through my words, I seek to inspire transformation &mdash; to break free from conditioning, confront reality without fear, and live with greater clarity, courage, and awareness.',
 'about.creed':'Sufi Ilham is not just a name. It is a way of being.',
 'foot.follow':'Follow',
 'jour.tag':'The Path So Far','jour.head':'A writing <em>journey</em>',
 'j1':'The debut. A journey into the hidden architecture of the mind — and how to rewrite it.',
 'j2':'The most talked-about title. What if time isn\'t real, but a beautiful lie?',
 'j3':'Learning from birth to beyond — for those brave enough to keep attending.',
 'j4t':'Seven New Works','j4':'NeuroFocus Protocol, The Human Operating Manual, The Wall Was a Gesture, The Map Is Finished, Moh Tera Prem, PREM, and The River\'s Portion.',
 'con.tag':'Get In Touch','con.head':'Say <em>hello</em>',
 'con.sub':'For reader messages, interviews, collaborations, bulk orders or translation rights — reach out directly.',
 'con.phone':'Phone','con.wa':'WhatsApp','con.wad':'Message directly','con.store':'Amazon Author Store',
 'con.stored':'Follow for new releases','con.based':'Based in','con.basedd':'Bihar, India · Available worldwide',
 'con.name':'Your Name','con.email':'Email','con.subject':'Subject','con.msg':'Message',
 'con.ph_name':'Enter your name','con.ph_msg':'Write your message…',
 'con.send':'Send via WhatsApp',
 'con.note':'Your message opens in WhatsApp to +91 62017 57330 — nothing is stored on this website.',
 's1':'Reader Message','s2':'Interview Request','s3':'Collaboration','s4':'Bulk / Bookstore Order','s5':'Translation Rights','s6':'Other',
 'cta.tag':'Start Reading','cta.head':'Begin where the <em>question</em> is loudest',
 'cta.sub':'Eleven titles — including all five Maple Falls romances — are free to read on Kindle Unlimited. Follow the author on Amazon to get new release updates the moment a book goes live.',
 'cta.b1':'Amazon.com Store','cta.b2':'Amazon.in Store',
'news.title':'Get notified of new books','news.sub':'One short email when a new book goes live. No spam, unsubscribe anytime.','news.ph':'you@example.com','news.btn':'Subscribe','news.note':'Free forever. Unsubscribe in one click.',
 'foot.about':'Books on belief, time, attention and the freedom that waits on the other side of conditioning. Available worldwide on Amazon in Kindle and paperback.',
 'foot.books':'Books','foot.explore':'Explore','foot.contact':'Contact','foot.rights':'All rights reserved.',
 'foot.privacy':'Privacy Policy','foot.terms':'Terms of Use','foot.aboutl':'About the Author','foot.msg':'Send a message',
 'go.title':'Opening Amazon','go.sub':'Taking you to the secure Amazon store…','go.cancel':'Cancel',
 'snd.on':'Sound on','snd.off':'Sound off','lang.label':'Language'
},

hi:{
 _name:'हिन्दी', _dir:'ltr', _font:"'Nirmala UI','Noto Sans Devanagari',var(--sans)",
 'nav.new':'नई पुस्तक','nav.books':'पुस्तकें','nav.themes':'विषय','nav.about':'परिचय',
 'nav.contact':'संपर्क','nav.privacy':'गोपनीयता','nav.store':'अमेज़न स्टोर',
 'hero.eyebrow':'सोलह पुस्तकें · दर्शन, आत्म-खोज, साहित्य एवं रोमांस',
 'hero.alias':'एमडी नैयर आलम के नाम से भी जाने जाते हैं',
 'hero.lede':'एक लेखक और गहन विचारक, जो विश्वास-प्रणालियों और आत्म-खोज की पड़ताल करते हैं — ऐसा लेखन जो सामाजिक मान्यताओं को चुनौती देता है और आपसे कहता है कि <strong>विरासत में मिली हर धारणा पर प्रश्न कीजिए।</strong>',
 'hero.lede2':'विश्वास की संरचना से लेकर समय के भ्रम तक, एडीएचडी और एकाग्रता से लेकर केवल देख पाने की शांत स्वतंत्रता तक — मेपल फ़ॉल्स की पाँच प्रेम कहानियाँ तथा द रिवर्स पोर्शन (दरिया का हिस्सा)। सोलह पुस्तकें, एक ही खोज: सत्य, चाहे वह कितना ही असहज क्यों न हो।',
 'hero.cta1':'नई पुस्तक पढ़ें','hero.cta2':'सभी पुस्तकें देखें','hero.scroll':'नीचे जाएँ',
 'stat.titles':'प्रकाशित पुस्तकें','stat.pages':'कुल पृष्ठ',
 'stat.ku':'किंडल अनलिमिटेड पर निःशुल्क','stat.markets':'अमेज़न मार्केटप्लेस',
 'feat.tag':'नई पुस्तक','feat.head':'आपके टोस्टर के साथ मैनुअल आया था। <em>आपके साथ नहीं।</em>',
 'feat.sub':'बेहतर मन, बेहतर आदतें और बेहतर जीवन रचने की एक सिस्टम-आधारित मार्गदर्शिका',
 'feat.quote':'"आप टूटे हुए नहीं हैं। आप पुरानी सेटिंग्स पर चल रहे हैं — और सेटिंग्स बदली जा सकती हैं।"',
 'feat.p1':'आप इस ग्रह की सबसे जटिल मशीन हैं, और आपको बिना किसी दस्तावेज़ के भेज दिया गया। इसलिए आपने वही किया जो हर कोई करता है: वही तीन बटन और ज़ोर से दबाए। अधिक प्रेरणा। अधिक अनुशासन। अधिक अपराधबोध।',
 'feat.p2':'एक उत्कृष्ट हार्डवेयर मैनुअल की शांत, सटीक भाषा में लिखी गई — <strong>111 मौलिक चित्र, 34 अभ्यास-पृष्ठ और 10 पूर्ण सिस्टम मॉड्यूल</strong> के साथ — यह आपके जीवन को वैसा ही मानती है जैसा वह वास्तव में है: ऊर्जा, भाव, ध्यान और आदत की एक जीवंत प्रणाली।',
 'feat.m1':'दैनिक संचालन','feat.m2':'निर्माण एवं मरम्मत','feat.m3':'दीर्घ यात्रा',
 'feat.it':'सुबह 4 बजे का अलार्म नहीं। कोई शोर नहीं।<br>परिणामों को जकड़ना छोड़िए — सेटिंग्स बदलना शुरू कीजिए।',
 'feat.buy1':'Amazon.com से खरीदें','feat.buy2':'Amazon.in से खरीदें',
 'books.tag':'पुस्तकालय','books.head':'सभी <em>पुस्तकें</em>',
 'books.sub':'सूफ़ी इल्हाम की हर कृति — किंडल और पेपरबैक में, विश्वभर में अमेज़न पर तथा आगामी विशेष संस्करण। अधिक जानने के लिए किसी भी पुस्तक पर क्लिक करें।',
 'f.all':'सभी पुस्तकें','f.phil':'दर्शन','f.self':'स्व-सहायता','f.ku':'किंडल अनलिमिटेड','f.pb':'पेपरबैक','f.maple':'मेपल फ़ॉल्स रोमांस',
 'card.more':'और पढ़ें','card.buy':'अमेज़न',
 'nav.maple':'मेपल फ़ॉल्स','foot.maple':'मेपल फ़ॉल्स रोमांस',
 'mf.tag':'मेपल फ़ॉल्स रोमांस सीरीज़',
 'mf.head':'पाँच प्रेम कहानियाँ। <em>एक ऐसा क़स्बा जो कभी नहीं छोड़ता।</em>',
 'mf.lede':'कुछ जगहें ज़िंदगी बदल देती हैं। यह जगह दिल चुरा लेगी। स्वागत है <strong>मेपल फ़ॉल्स, वरमॉन्ट</strong> में &mdash; मेपल के पेड़ों वाली सड़क के आख़िरी सिरे पर बसा एक छोटा-सा क़स्बा, जहाँ किताबों की दुकान की बत्तियाँ जलती रहती हैं, बेकरी के तंदूर गरम रहते हैं, और हर प्रेम कहानी को उसका हैप्पी एंडिंग मिलता है।',
 'mf.lede2':'चिड़चिड़ा नायक और धूप-सी नायिका। दुश्मनी से मोहब्बत तक। दूसरे मौक़े। बर्फ़ के ढेर। आतिशबाज़ियाँ। एक क़स्बा जहाँ हर किसी को उसका अंत मिलता है &mdash; और पाँचों किताबें किंडल अनलिमिटेड पर मुफ़्त पढ़ी जा सकती हैं।',
 'mf.order':'पढ़ने का क्रम','mf.note':'किताब 1 से शुरू कीजिए, या कहीं से भी जुड़ जाइए &mdash; मेपल फ़ॉल्स आपके लिए जगह रख लेगा।',
 'mf.cta1':'किताब 1 से शुरू करें','mf.cta2':'पूरी सीरीज़ अमेज़न पर देखें',
 'themes.tag':'आवर्ती सूत्र','themes.head':'यह लेखन बार-बार <em>जिस ओर लौटता है</em>',
 'th1':'विश्वास','th1d':'आपके संबंधों, करियर और प्रसन्नता के नीचे छिपी संरचना — और यह सत्य कि उस संरचना को पुनः रचा जा सकता है।',
 'th2':'समय','th2d':'अतीत और भविष्य का जुनून चुपचाप जीवन क्यों चुरा लेता है, और जब घड़ी अपना अधिकार खो देती है तब क्या शेष रहता है।',
 'th3':'ध्यान','th3d':'एक साँस भर लंबा धागा। पूरी कला लौट आने में है — ध्यान में, एकाग्रता में, साधारण दोपहरों में।',
 'th4':'देखना','th4d':'न सिद्धांत, न स्व-सहायता। कुछ अधिक प्राचीन: धड़कते हृदय वाला दर्शन, जो आपसे कुछ भी मानने को नहीं कहता।',
 'quote.text':'नक्शा देश नहीं होता। तब तक चलिए जब तक अंतर समझ न आ जाए।','quote.cite':'— द मैप इज़ फ़िनिश्ड',
 'about.tag':'लेखक परिचय','about.head':'सत्य की <em>निर्भीक खोज</em>',
 'about.p1':'सूफ़ी इल्हाम, जिन्हें एमडी नैयर आलम के नाम से भी जाना जाता है, एक लेखक, गहन विचारक और सत्य के अन्वेषक हैं जो आस्था, चेतना, पहचान और आत्म-खोज की पड़ताल करते हैं।',
 'about.p2':'&ldquo;सूफ़ी इल्हाम&rdquo; वह नाम है जो मैंने स्वयं को दिया। मेरे लिए यह <strong>उस अर्थ का प्रतीक है जिसे मैं जीता हूँ</strong> &mdash; एक स्मरण कि जीवन केवल काट देने की वस्तु नहीं, बल्कि समझने, प्रश्न करने और प्रामाणिक रूप से अनुभव करने की चीज़ है।',
 'about.p3':'मेरा लेखन विरासत में मिली मान्यताओं और सामाजिक संस्कारों को चुनौती देता है, और पाठकों को आमंत्रित करता है कि वे धारणाओं को आँख मूँदकर स्वीकार करने के बजाय उन पर प्रश्न करें। मैं अस्तित्व, दर्शन, मानव स्वभाव और सत्य की खोज की कच्ची और अक्सर असहज सच्चाइयों में उतरता हूँ।',
 'about.p4':'मेरा विश्वास है कि प्रामाणिकता तभी आरंभ होती है जब हम उससे परे देखने का साहस करें जो हमें सिखाया गया है, और वह खोजें जो सचमुच हमारा अपना है।',
 'about.p5':'अपने शब्दों के माध्यम से मैं परिवर्तन की प्रेरणा देना चाहता हूँ &mdash; संस्कारों के बंधन तोड़ना, वास्तविकता का निर्भय सामना करना, और अधिक स्पष्टता, साहस और जागरूकता के साथ जीना।',
 'about.creed':'सूफ़ी इल्हाम केवल एक नाम नहीं है। यह होने का एक तरीका है।',
 'foot.follow':'फ़ॉलो करें',
 'jour.tag':'अब तक की यात्रा','jour.head':'एक लेखकीय <em>यात्रा</em>',
 'j1':'पहली कृति। मन की छिपी संरचना में एक यात्रा — और उसे पुनः लिखने की विधि।',
 'j2':'सर्वाधिक चर्चित पुस्तक। यदि समय वास्तविक न हो, बल्कि एक सुंदर झूठ हो तो?',
 'j3':'जन्म से परे तक सीखना — उनके लिए जो सीखते रहने का साहस रखते हैं।',
 'j4t':'सात नई कृतियाँ','j4':'न्यूरोफ़ोकस प्रोटोकॉल, द ह्यूमन ऑपरेटिंग मैनुअल, द वॉल वाज़ अ जेस्चर, द मैप इज़ फ़िनिश्ड, मोह तेरा प्रेम, प्रेम, और द रिवर्स पोर्शन (दरिया का हिस्सा)।',
 'con.tag':'संपर्क करें','con.head':'नमस्ते <em>कहिए</em>',
 'con.sub':'पाठकों के संदेश, साक्षात्कार, सहयोग, थोक ऑर्डर या अनुवाद अधिकारों के लिए — सीधे संपर्क करें।',
 'con.phone':'फ़ोन','con.wa':'व्हाट्सएप','con.wad':'सीधे संदेश भेजें','con.store':'अमेज़न लेखक स्टोर',
 'con.stored':'नई पुस्तकों के लिए फ़ॉलो करें','con.based':'स्थान','con.basedd':'बिहार, भारत · विश्वभर में उपलब्ध',
 'con.name':'आपका नाम','con.email':'ईमेल','con.subject':'विषय','con.msg':'संदेश',
 'con.ph_name':'अपना नाम लिखें','con.ph_msg':'अपना संदेश लिखें…',
 'con.send':'व्हाट्सएप से भेजें',
 'con.note':'आपका संदेश व्हाट्सएप पर +91 62017 57330 पर खुलेगा — इस वेबसाइट पर कुछ भी संग्रहीत नहीं होता।',
 's1':'पाठक संदेश','s2':'साक्षात्कार अनुरोध','s3':'सहयोग','s4':'थोक / बुकस्टोर ऑर्डर','s5':'अनुवाद अधिकार','s6':'अन्य',
 'cta.tag':'पढ़ना आरंभ करें','cta.head':'वहीं से शुरू कीजिए जहाँ <em>प्रश्न</em> सबसे प्रबल है',
 'cta.sub':'ग्यारह पुस्तकें किंडल अनलिमिटेड पर निःशुल्क पढ़ी जा सकती हैं। नई पुस्तकों की सूचना के लिए अमेज़न पर लेखक को फ़ॉलो करें।',
 'cta.b1':'Amazon.com स्टोर','cta.b2':'Amazon.in स्टोर',
'news.title':'नई पुस्तकों की सूचना पाएँ','news.sub':'नई पुस्तक प्रकाशित होने पर एक छोटा ईमेल। कोई स्पैम नहीं, कभी भी सदस्यता छोड़ें।','news.ph':'you@example.com','news.btn':'सदस्यता लें','news.note':'सदैव निःशुल्क। एक क्लिक में सदस्यता समाप्त।',
 'foot.about':'विश्वास, समय, ध्यान और संस्कारों के पार प्रतीक्षा करती स्वतंत्रता पर पुस्तकें। विश्वभर में अमेज़न पर किंडल और पेपरबैक में उपलब्ध।',
 'foot.books':'पुस्तकें','foot.explore':'अन्वेषण','foot.contact':'संपर्क','foot.rights':'सर्वाधिकार सुरक्षित।',
 'foot.privacy':'गोपनीयता नीति','foot.terms':'उपयोग की शर्तें','foot.aboutl':'लेखक परिचय','foot.msg':'संदेश भेजें',
 'go.title':'अमेज़न खुल रहा है','go.sub':'आपको सुरक्षित अमेज़न स्टोर पर ले जाया जा रहा है…','go.cancel':'रद्द करें',
 'snd.on':'ध्वनि चालू','snd.off':'ध्वनि बंद','lang.label':'भाषा'
},

ur:{
 _name:'اردو', _dir:'rtl', _font:"'Noto Nastaliq Urdu','Jameel Noori Nastaleeq','Noto Naskh Arabic',var(--sans)",
 'nav.new':'نئی کتاب','nav.books':'کتابیں','nav.themes':'موضوعات','nav.about':'تعارف',
 'nav.contact':'رابطہ','nav.privacy':'رازداری','nav.store':'ایمازون اسٹور',
 'hero.eyebrow':'سولہ کتابیں · فلسفہ، خود شناسی، ادب اور رومانس',
 'hero.alias':'ایم ڈی نیر عالم کے نام سے بھی معروف',
 'hero.lede':'ایک مصنف اور گہرے مفکر، جو عقائد کے نظام اور خود شناسی کی کھوج کرتے ہیں — ایسی تحریر جو سماجی روایات کو چیلنج کرتی ہے اور آپ سے کہتی ہے کہ <strong>ہر ورثے میں ملے گمان پر سوال اٹھائیے۔</strong>',
 'hero.lede2':'عقیدے کی ساخت سے وقت کے فریب تک، اے ڈی ایچ ڈی اور توجہ سے محض دیکھ لینے کی پرسکون آزادی تک — میپل فالز کی پانچ محبت بھری کہانیاں اور شاہکار ناول حصۂ دریا (The River\'s Portion)۔ سولہ کتابیں، ایک ہی جستجو: سچ، خواہ کتنا ہی بے چین کرنے والا ہو۔',
 'hero.cta1':'نئی کتاب پڑھیے','hero.cta2':'تمام کتابیں دیکھیے','hero.scroll':'نیچے',
 'stat.titles':'شائع شدہ کتابیں','stat.pages':'کل صفحات',
 'stat.ku':'کنڈل انلمیٹڈ پر مفت','stat.markets':'ایمازون مارکیٹ',
 'feat.tag':'نئی کتاب','feat.head':'آپ کے ٹوسٹر کے ساتھ ہدایت نامہ آیا تھا۔ <em>آپ کے ساتھ نہیں۔</em>',
 'feat.sub':'بہتر ذہن، بہتر عادات اور بہتر زندگی تشکیل دینے کی ایک نظام پر مبنی رہنمائی',
 'feat.quote':'"آپ ٹوٹے ہوئے نہیں ہیں۔ آپ پرانی ترتیبات پر چل رہے ہیں — اور ترتیبات بدلی جا سکتی ہیں۔"',
 'feat.p1':'آپ اس کرۂ ارض کی پیچیدہ ترین مشین ہیں، اور آپ کو بغیر کسی دستاویز کے بھیج دیا گیا۔ سو آپ نے وہی کیا جو ہر کوئی کرتا ہے: وہی تین بٹن اور زور سے دبائے۔ زیادہ ترغیب۔ زیادہ نظم۔ زیادہ احساسِ جرم۔',
 'feat.p2':'ایک اعلیٰ ہارڈویئر ہدایت نامے کی پرسکون، دقیق زبان میں لکھی گئی — <strong>111 اصل خاکے، 34 مشقی صفحات اور 10 مکمل ماڈیول</strong> کے ساتھ — یہ آپ کی زندگی کو وہی سمجھتی ہے جو وہ حقیقتاً ہے: توانائی، جذبے، توجہ اور عادت کا ایک زندہ نظام۔',
 'feat.m1':'روزمرہ عمل','feat.m2':'تعمیر و مرمت','feat.m3':'طویل سفر',
 'feat.it':'صبح چار بجے کا الارم نہیں۔ کوئی شور نہیں۔<br>نتائج کو جکڑنا چھوڑیے — ترتیبات بدلنا شروع کیجیے۔',
 'feat.buy1':'Amazon.com سے خریدیں','feat.buy2':'Amazon.in سے خریدیں',
 'books.tag':'کتب خانہ','books.head':'تمام <em>کتابیں</em>',
 'books.sub':'صوفی الہام کی ہر تصنیف — کنڈل اور پیپربیک میں، دنیا بھر میں ایمازون پر اور خصوصی ایڈیشنز۔ مزید جاننے کے لیے کسی بھی کتاب پر کلک کیجیے۔',
 'f.all':'تمام کتابیں','f.phil':'فلسفہ','f.self':'خود مدد','f.ku':'کنڈل انلمیٹڈ','f.pb':'پیپربیک','f.maple':'میپل فالز رومانس',
 'card.more':'مزید پڑھیے','card.buy':'ایمازون',
 'nav.maple':'میپل فالز','foot.maple':'میپل فالز رومانس',
 'mf.tag':'میپل فالز رومانس سیریز',
 'mf.head':'پانچ محبت کی کہانیاں۔ <em>ایک ایسا قصبہ جو کبھی نہیں چھوڑتا۔</em>',
 'mf.lede':'کچھ جگہیں زندگی بدل دیتی ہیں۔ یہ جگہ دل چرا لے گی۔ خوش آمدید <strong>میپل فالز، ورمونٹ</strong> میں &mdash; میپل کے درختوں والی سڑک کے آخری سرے پر بسا ایک چھوٹا سا قصبہ، جہاں کتابوں کی دکان کی روشنیاں جلتی رہتی ہیں، بیکری کے تنور گرم رہتے ہیں، اور ہر محبت کی کہانی کو اس کا خوشگوار انجام ملتا ہے۔',
 'mf.lede2':'چڑچڑا ہیرو اور دھوپ جیسی ہیروئن۔ دشمنی سے محبت تک۔ دوسرے مواقع۔ برف کے ڈھیر۔ آتش بازیاں۔ ایک قصبہ جہاں ہر کسی کو اس کا انجام ملتا ہے &mdash; اور پانچوں کتابیں کنڈل انلمیٹڈ پر مفت پڑھی جا سکتی ہیں۔',
 'mf.order':'پڑھنے کی ترتیب','mf.note':'کتاب 1 سے شروع کیجیے، یا کہیں سے بھی شامل ہو جائیے &mdash; میپل فالز آپ کے لیے جگہ رکھ لے گا۔',
 'mf.cta1':'کتاب 1 سے شروع کیجیے','mf.cta2':'پوری سیریز ایمازون پر دیکھیے',
 'themes.tag':'بار بار آنے والے موضوعات','themes.head':'یہ تحریر بار بار <em>جس طرف لوٹتی ہے</em>',
 'th1':'عقیدہ','th1d':'آپ کے رشتوں، پیشے اور خوشی کے نیچے چھپی ساخت — اور یہ حقیقت کہ اس ساخت کو نئے سرے سے تعمیر کیا جا سکتا ہے۔',
 'th2':'وقت','th2d':'ماضی اور مستقبل کا جنون خاموشی سے زندگی کیوں چرا لیتا ہے، اور جب گھڑی اپنا اختیار کھو دیتی ہے تو کیا باقی رہتا ہے۔',
 'th3':'توجہ','th3d':'ایک سانس بھر لمبا دھاگا۔ سارا فن لوٹ آنے میں ہے — مراقبے میں، ارتکاز میں، عام دوپہروں میں۔',
 'th4':'دیکھنا','th4d':'نہ عقیدہ، نہ خود مدد۔ کچھ زیادہ قدیم: دھڑکتے دل والا فلسفہ، جو آپ سے کچھ ماننے کو نہیں کہتا۔',
 'quote.text':'نقشہ ملک نہیں ہوتا۔ تب تک چلیے جب تک فرق معلوم نہ ہو جائے۔','quote.cite':'— دی میپ اِز فِنِشڈ',
 'about.tag':'مصنف کا تعارف','about.head':'سچ کی <em>بے خوف جستجو</em>',
 'about.p1':'صوفی الہام، جنہیں ایم ڈی نیر عالم کے نام سے بھی جانا جاتا ہے، ایک مصنف، گہرے مفکر اور سچ کے متلاشی ہیں جو عقیدے، شعور، شناخت اور خود شناسی کی کھوج کرتے ہیں۔',
 'about.p2':'&ldquo;صوفی الہام&rdquo; وہ نام ہے جو میں نے خود کو دیا۔ میرے نزدیک یہ <strong>اُس معنی کی علامت ہے جسے میں جیتا ہوں</strong> &mdash; ایک یاد دہانی کہ زندگی محض گزارنے کی چیز نہیں، بلکہ سمجھنے، سوال کرنے اور اصل روپ میں محسوس کرنے کی چیز ہے۔',
 'about.p3':'میری تحریر ورثے میں ملے عقائد اور سماجی تربیت کو چیلنج کرتی ہے، اور قارئین کو دعوت دیتی ہے کہ وہ مفروضوں کو آنکھ بند کر کے قبول کرنے کے بجائے اُن پر سوال کریں۔ میں وجود، فلسفے، انسانی فطرت اور سچ کی تلاش کی کھری اور اکثر بے چین کرنے والی حقیقتوں میں اترتا ہوں۔',
 'about.p4':'میرا یقین ہے کہ اصلیت وہیں سے شروع ہوتی ہے جب ہم اُس سے آگے دیکھنے کی جرأت کریں جو ہمیں سکھایا گیا ہے، اور وہ دریافت کریں جو حقیقتاً ہمارا اپنا ہے۔',
 'about.p5':'اپنے الفاظ کے ذریعے میں تبدیلی کی تحریک دینا چاہتا ہوں &mdash; مشروط سوچ سے آزادی، حقیقت کا بے خوف سامنا، اور زیادہ وضاحت، حوصلے اور آگاہی کے ساتھ جینا۔',
 'about.creed':'صوفی الہام محض ایک نام نہیں۔ یہ ہونے کا ایک انداز ہے۔',
 'foot.follow':'فالو کریں',
 'jour.tag':'اب تک کا سفر','jour.head':'ایک تحریری <em>سفر</em>',
 'j1':'پہلی تصنیف۔ ذہن کی پوشیدہ ساخت میں ایک سفر — اور اسے نئے سرے سے لکھنے کا طریقہ۔',
 'j2':'سب سے زیادہ زیرِ بحث کتاب۔ اگر وقت حقیقی نہ ہو، بلکہ ایک خوبصورت جھوٹ ہو تو؟',
 'j3':'پیدائش سے آگے تک سیکھنا — ان کے لیے جو سیکھتے رہنے کی جرأت رکھتے ہیں۔',
 'j4t':'سات نئی تصانیف','j4':'نیوروفوکس پروٹوکول، دی ہیومن آپریٹنگ مینوئل، دی وال واز اے جیسچر، دی میپ اِز فِنِشڈ، موہ تیرا پریم، پریم، اور حصۂ دریا (دی ریورز پورشن)۔',
 'con.tag':'رابطہ کیجیے','con.head':'سلام <em>کہیے</em>',
 'con.sub':'قارئین کے پیغامات، انٹرویو، اشتراک، تھوک آرڈر یا ترجمے کے حقوق کے لیے — براہِ راست رابطہ کیجیے۔',
 'con.phone':'فون','con.wa':'واٹس ایپ','con.wad':'براہِ راست پیغام','con.store':'ایمازون مصنف اسٹور',
 'con.stored':'نئی کتابوں کے لیے فالو کیجیے','con.based':'مقام','con.basedd':'بہار، بھارت · دنیا بھر میں دستیاب',
 'con.name':'آپ کا نام','con.email':'ای میل','con.subject':'موضوع','con.msg':'پیغام',
 'con.ph_name':'اپنا نام لکھیے','con.ph_msg':'اپنا پیغام لکھیے…',
 'con.send':'واٹس ایپ سے بھیجیں',
 'con.note':'آپ کا پیغام واٹس ایپ پر ‎+91 62017 57330‎ پر کھلے گا — اس ویب سائٹ پر کچھ محفوظ نہیں ہوتا۔',
 's1':'قاری کا پیغام','s2':'انٹرویو کی درخواست','s3':'اشتراک','s4':'تھوک / بک اسٹور آرڈر','s5':'ترجمے کے حقوق','s6':'دیگر',
 'cta.tag':'پڑھنا شروع کیجیے','cta.head':'وہیں سے شروع کیجیے جہاں <em>سوال</em> سب سے بلند ہے',
 'cta.sub':'گیارہ کتابیں کنڈل انلمیٹڈ پر مفت پڑھی جا سکتی ہیں۔ نئی کتابوں کی اطلاع کے لیے ایمازون پر مصنف کو فالو کیجیے۔',
 'cta.b1':'Amazon.com اسٹور','cta.b2':'Amazon.in اسٹور',
'news.title':'نئی کتابوں کی اطلاع پائیں','news.sub':'نئی کتاب شائع ہونے پر ایک مختصر ای میل۔ کوئی اسپیم نہیں، کسی بھی وقت رکنیت ختم کریں۔','news.ph':'you@example.com','news.btn':'رکنیت لیں','news.note':'ہمیشہ مفت۔ ایک کلک میں رکنیت ختم۔',
 'foot.about':'عقیدے، وقت، توجہ اور مشروط سوچ کے پار منتظر آزادی پر کتابیں۔ دنیا بھر میں ایمازون پر کنڈل اور پیپربیک میں دستیاب۔',
 'foot.books':'کتابیں','foot.explore':'دریافت','foot.contact':'رابطہ','foot.rights':'جملہ حقوق محفوظ ہیں۔',
 'foot.privacy':'رازداری کی پالیسی','foot.terms':'استعمال کی شرائط','foot.aboutl':'مصنف کا تعارف','foot.msg':'پیغام بھیجیں',
 'go.title':'ایمازون کھل رہا ہے','go.sub':'آپ کو محفوظ ایمازون اسٹور پر لے جایا جا رہا ہے…','go.cancel':'منسوخ',
 'snd.on':'آواز چالو','snd.off':'آواز بند','lang.label':'زبان'
},

hinglish:{
 _name:'Hinglish', _dir:'ltr', _font:"var(--sans)",
 'nav.new':'Nayi Kitab','nav.books':'Kitabein','nav.themes':'Themes','nav.about':'Parichay',
 'nav.contact':'Contact','nav.privacy':'Privacy','nav.store':'Amazon Store',
 'hero.eyebrow':'Solah Kitabein · Philosophy, Self-Discovery, Fiction aur Romance',
 'hero.alias':'MD Naiyer Alam ke naam se bhi jaane jaate hain',
 'hero.lede':'Ek author aur gehre thinker, jo belief systems aur self-discovery ko explore karte hain — aisi writing jo society ke banaye rules ko challenge karti hai aur aapse kehti hai ki <strong>jo bhi maan liya hai, us par sawaal kijiye.</strong>',
 'hero.lede2':'Belief ki architecture se lekar time ke illusion tak, ADHD aur attention se lekar sirf dekh paane ki shaant azadi tak — Vermont ke Maple Falls ki paanch love stories aur The River\'s Portion (Darya Ka Hissa). Solah kitabein, ek hi talash: sach, chahe kitna hi uncomfortable ho.',
 'hero.cta1':'Nayi Kitab Padhiye','hero.cta2':'Saari Kitabein Dekhiye','hero.scroll':'Scroll',
 'stat.titles':'Published Kitabein','stat.pages':'Total Pages',
 'stat.ku':'Kindle Unlimited par Free','stat.markets':'Amazon Marketplaces',
 'feat.tag':'Nayi Kitab','feat.head':'Aapke toaster ke saath manual aaya tha. <em>Aapke saath nahi.</em>',
 'feat.sub':'Behtar Mind, Behtar Habits aur Behtar Life design karne ki ek Systems-Based Guide',
 'feat.quote':'"Aap broken nahi hain. Aap purani settings par chal rahe hain — aur settings badli ja sakti hain."',
 'feat.p1':'Aap is planet ki sabse complex machine hain, aur aapko zero documentation ke saath bhej diya gaya. Toh aapne wahi kiya jo sab karte hain: wahi teen buttons aur zor se dabaye. Zyada motivation. Zyada discipline. Zyada guilt.',
 'feat.p2':'Ek premium hardware manual ki shaant, precise zubaan mein likhi gayi — <strong>111 original diagrams, 34 write-in worksheets aur 10 complete system modules</strong> ke saath — ye aapki life ko wahi maanti hai jo wo asal mein hai: energy, emotion, attention aur habit ka ek living system.',
 'feat.m1':'Daily Operation','feat.m2':'Building &amp; Repair','feat.m3':'The Long Game',
 'feat.it':'Subah 4 baje ka alarm nahi. Koi hype nahi.<br>Outcomes ko pakadna chhodiye — settings adjust karna shuru kijiye.',
 'feat.buy1':'Amazon.com se khareedein','feat.buy2':'Amazon.in se khareedein',
 'books.tag':'The Library','books.head':'Saari <em>Kitabein</em>',
 'books.sub':'Sufi Ilham ki har kitab — Kindle aur paperback mein, duniya bhar mein Amazon par aur upcoming special editions. Zyada jaanne ke liye kisi bhi kitab par click kijiye.',
 'f.all':'Saari Kitabein','f.phil':'Philosophy','f.self':'Self-Help','f.ku':'Kindle Unlimited','f.pb':'Paperback','f.maple':'Maple Falls Romance',
 'card.more':'Aur Padhiye','card.buy':'Amazon',
 'nav.maple':'Maple Falls','foot.maple':'Maple Falls Romance',
 'mf.tag':'Maple Falls Romance Series',
 'mf.head':'Paanch love stories. <em>Ek town jo kabhi chhodta nahi.</em>',
 'mf.lede':'Kuch shehar zindagi badal dete hain. Yeh wala dil chura lega. Welcome to <strong>Maple Falls, Vermont</strong> &mdash; maple ke pedon wali sadak ke aakhiri sire par basa ek chhota sa town, jahan bookshop ki lights jalti rehti hain, bakery ke oven garam rehte hain, aur har love story ko uska happily-ever-after milta hai.',
 'mf.lede2':'Grumpy sunshine. Enemies to lovers. Second chances. Barf ke dher. Fireworks. Ek town jahan sabko unka ending milta hai &mdash; aur paanchon kitabein Kindle Unlimited par free hain.',
 'mf.order':'Padhne ka order','mf.note':'Book 1 se shuru kijiye, ya kahin se bhi jump kar lijiye &mdash; Maple Falls aapke liye seat rakh lega.',
 'mf.cta1':'Book 1 se shuru kijiye','mf.cta2':'Poori series Amazon par dekhiye',
 'themes.tag':'Baar Baar Aane Wale Themes','themes.head':'Ye writing baar baar <em>jahan lautti hai</em>',
 'th1':'Belief','th1d':'Aapke rishton, career aur khushi ke neeche chhupi architecture — aur ye sach ki us architecture ko dobara banaya ja sakta hai.',
 'th2':'Time','th2d':'Past aur future ka obsession chupchaap zindagi kyun chura leta hai, aur jab ghadi apna adhikar kho deti hai tab kya bachta hai.',
 'th3':'Attention','th3d':'Ek saans bhar lamba dhaaga. Poori kala laut aane mein hai — meditation mein, focus mein, aam dopaharon mein.',
 'th4':'Seeing','th4d':'Na doctrine, na self-help. Kuch zyada purana: dhadakte dil wala philosophy, jo aapse kuch maanne ko nahi kehta.',
 'quote.text':'Naksha desh nahi hota. Tab tak chaliye jab tak farq samajh na aa jaye.','quote.cite':'— The Map Is Finished',
 'about.tag':'Author ke Baare Mein','about.head':'Sach ki <em>nidar talash</em>',
 'about.p1':'Sufi Ilham, jinhe MD Naiyer Alam ke naam se bhi jaana jaata hai, ek author, deep thinker aur sach ke seeker hain jo belief, consciousness, identity aur self-discovery ko explore karte hain.',
 'about.p2':'&ldquo;Sufi Ilham&rdquo; woh naam hai jo maine khud ko diya. Mere liye yeh <strong>us maayne ka pratik hai jise main jeeta hoon</strong> &mdash; ek reminder ki zindagi sirf kaat dene ki cheez nahi, balki samajhne, sawaal karne aur authentically experience karne ki cheez hai.',
 'about.p3':'Meri writing inherited beliefs aur societal conditioning ko challenge karti hai, aur readers ko invite karti hai ki woh assumptions ko blindly accept karne ke bajaye unpar sawaal karein. Main existence, philosophy, human nature aur sach ki talash ki raw aur aksar uncomfortable realities mein utarta hoon.',
 'about.p4':'Mera maanna hai ki authenticity tabhi shuru hoti hai jab hum us se aage dekhne ki himmat karein jo humein sikhaya gaya hai, aur woh discover karein jo sach mein hamara apna hai.',
 'about.p5':'Apne shabdon ke through main transformation inspire karna chahta hoon &mdash; conditioning se azaad hona, reality ka bina dar ke saamna karna, aur zyada clarity, courage aur awareness ke saath jeena.',
 'about.creed':'Sufi Ilham sirf ek naam nahi hai. Yeh hone ka ek tareeka hai.',
 'foot.follow':'Follow karein',
 'jour.tag':'Ab Tak Ka Safar','jour.head':'Ek writing <em>journey</em>',
 'j1':'Pehli kitab. Mind ki chhupi architecture mein ek safar — aur use dobara likhne ka tarika.',
 'j2':'Sabse zyada charchit kitab. Agar time real na ho, balki ek khoobsurat jhooth ho toh?',
 'j3':'Janm se aage tak seekhna — un logon ke liye jo seekhte rehne ki himmat rakhte hain.',
 'j4t':'Saat Nayi Kitabein','j4':'NeuroFocus Protocol, The Human Operating Manual, The Wall Was a Gesture, The Map Is Finished, Moh Tera Prem, PREM, aur The River\'s Portion.',
 'con.tag':'Sampark Kijiye','con.head':'Kahiye <em>hello</em>',
 'con.sub':'Reader messages, interviews, collaboration, bulk order ya translation rights ke liye — seedha sampark kijiye.',
 'con.phone':'Phone','con.wa':'WhatsApp','con.wad':'Seedha message bhejiye','con.store':'Amazon Author Store',
 'con.stored':'Nayi kitabon ke liye follow kijiye','con.based':'Location','con.basedd':'Bihar, India · Duniya bhar mein available',
 'con.name':'Aapka Naam','con.email':'Email','con.subject':'Subject','con.msg':'Message',
 'con.ph_name':'Apna naam likhiye','con.ph_msg':'Apna message likhiye…',
 'con.send':'WhatsApp se bhejein',
 'con.note':'Aapka message WhatsApp par +91 62017 57330 par khulega — is website par kuch bhi store nahi hota.',
 's1':'Reader Message','s2':'Interview Request','s3':'Collaboration','s4':'Bulk / Bookstore Order','s5':'Translation Rights','s6':'Other',
 'cta.tag':'Padhna Shuru Kijiye','cta.head':'Wahin se shuru kijiye jahan <em>sawaal</em> sabse tez hai',
 'cta.sub':'Gyarah kitabein Kindle Unlimited par free padhi ja sakti hain. Nayi kitabon ki update ke liye Amazon par author ko follow kijiye.',
 'cta.b1':'Amazon.com Store','cta.b2':'Amazon.in Store',
'news.title':'Nayi kitabon ki update paayein','news.sub':'Nayi kitab live hone par ek chhota email. No spam, kabhi bhi unsubscribe.','news.ph':'you@example.com','news.btn':'Subscribe karein','news.note':'Hamesha free. Ek click mein unsubscribe.',
 'foot.about':'Belief, time, attention aur conditioning ke paar intezaar karti azadi par kitabein. Duniya bhar mein Amazon par Kindle aur paperback mein available.',
 'foot.books':'Kitabein','foot.explore':'Explore','foot.contact':'Contact','foot.rights':'Sarvadhikar surakshit.',
 'foot.privacy':'Privacy Policy','foot.terms':'Terms of Use','foot.aboutl':'Author ke Baare Mein','foot.msg':'Message bhejiye',
 'go.title':'Amazon khul raha hai','go.sub':'Aapko secure Amazon store par le jaya ja raha hai…','go.cancel':'Cancel',
 'snd.on':'Sound on','snd.off':'Sound off','lang.label':'Bhasha'
}
};


/* ====== SOUNDTRACK · LANGUAGE · CINEMATIC AMAZON TRANSITION ====== */
(function(){
 'use strict';
 var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var LS = {get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
           set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

 /* ---------------- LANGUAGE ---------------- */
 var I18N = window.I18N || {};
 var lang = LS.get('si_lang') || 'en';
 if(!I18N[lang]) lang = 'en';

 function t(key){ var d=I18N[lang]||{}; return (key in d)?d[key]:((I18N.en&&I18N.en[key])||''); }

 function applyLang(code, animate){
   if(!I18N[code]) return;
   lang = code; LS.set('si_lang', code);
   if(window.plausible){ window.plausible('Language Change', { props: { language: code } }); }
   var d = I18N[code];
   var html = document.documentElement;
   html.setAttribute('lang', code==='hinglish'?'hi-Latn':code);
   html.setAttribute('dir', d._dir||'ltr');
   document.body.style.setProperty('--body-font', d._font||'var(--sans)');
   document.body.classList.toggle('rtl', (d._dir==='rtl'));
   document.body.classList.toggle('lang-ur', code==='ur');
   document.body.classList.toggle('lang-hi', code==='hi');

   var els = document.querySelectorAll('[data-i18n]');
   function swap(){
     els.forEach(function(el){
       var k = el.getAttribute('data-i18n'), v = t(k);
       if(v==='') return;
       var attr = el.getAttribute('data-i18n-attr');
       if(attr){ el.setAttribute(attr, v.replace(/<[^>]+>/g,'')); }
       else { el.innerHTML = v; }
     });
     // update <option> text
     document.querySelectorAll('[data-i18n-opt]').forEach(function(o){
       var v=t(o.getAttribute('data-i18n-opt')); if(v) o.textContent=v;
     });
     // language button label
     document.querySelectorAll('.lang-cur').forEach(function(e){ e.textContent = d._name; });
     document.querySelectorAll('.lang-opt').forEach(function(b){
       b.classList.toggle('on', b.getAttribute('data-lang')===code);
     });
   }
   if(animate && !RM){
     document.body.classList.add('lang-fade');
     setTimeout(function(){ swap(); document.body.classList.remove('lang-fade'); }, 260);
   } else swap();
 }

 function initLang(){
   var btn=document.getElementById('langBtn'), menu=document.getElementById('langMenu');
   if(btn&&menu){
     btn.addEventListener('click',function(e){ e.stopPropagation(); menu.classList.toggle('open'); });
     document.addEventListener('click',function(){ menu.classList.remove('open'); });
     menu.addEventListener('click',function(e){ e.stopPropagation(); });
     menu.querySelectorAll('.lang-opt').forEach(function(b){
       b.addEventListener('click',function(){
         applyLang(b.getAttribute('data-lang'), true);
         menu.classList.remove('open');
       });
     });
   }
   applyLang(lang,false);
 }

 /* -------- CINEMATIC AMAZON TRANSITION -------- */
 function initGo(){
   var ov=document.getElementById('goOv'); if(!ov) return;
   var titleEl=ov.querySelector('.go-title'), subEl=ov.querySelector('.go-sub'),
       bookEl=ov.querySelector('.go-book'), cancel=ov.querySelector('.go-cancel');
   var timer=null, target=null, popup=null;

   function show(url, cover, name, win){
     target=url; popup=win||null;
     if(window.plausible){ window.plausible('Amazon Click', { props: { book: name || url, url: url } }); }
     titleEl.textContent = name || t('go.title');
     subEl.textContent = t('go.sub');
     bookEl.innerHTML = cover ? '<img src="'+cover+'" alt="">' : '';
     cancel.textContent = t('go.cancel');
     ov.classList.add('open');
     var dur = RM?200:1500;
     timer=setTimeout(function(){
       if(popup && !popup.closed){
         // tab was opened during the user gesture; just point it at Amazon
         try{ popup.opener=null; }catch(err){}
         try{ popup.location.replace(target); popup.focus(); }
         catch(err){ location.href=target; }
       } else {
         // popup was blocked -> navigate this tab instead (never leaves user stuck)
         location.href=target;
       }
       popup=null; hide();
     },dur);
   }
   function hide(){
     clearTimeout(timer); ov.classList.remove('open'); document.body.style.overflow='';
     if(popup && !popup.closed){ try{popup.close();}catch(err){} }
     popup=null;
   }
   cancel.addEventListener('click',function(e){e.stopPropagation();hide();});
   ov.addEventListener('click',function(e){ if(e.target===ov) hide(); });
   document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&ov.classList.contains('open')) hide(); });

   // intercept every amazon link
   document.addEventListener('click',function(e){
     var a=e.target.closest('a[href*="amazon."]');
     if(!a) return;
     if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0) return;
     e.preventDefault();
     // open the tab NOW, inside the user gesture, so it is never popup-blocked
     var win=null;
     try{ win=window.open('','_blank'); }catch(err){ win=null; }
     if(win){ try{ win.opener=null;
       win.document.write('<!doctype html><meta charset=utf-8><title>Opening Amazon…</title>'+
         '<body style="margin:0;background:#08080a;color:#d4af54;font:14px/1.6 system-ui;'+
         'display:grid;place-items:center;height:100vh">Opening Amazon…</body>'); }catch(err){} }
     var card=a.closest('[data-book]'), cover='', nm=a.getAttribute('data-go-name')||'';
     if(card){
       try{ var d=JSON.parse(card.getAttribute('data-book')); cover=d.img; nm=nm||d.title; }catch(err){}
     }
     var mim=document.querySelector('#modal.open .m-cover img');
     if(!cover&&mim){ cover=mim.src; nm=nm||(document.querySelector('#modal h3')||{}).textContent; }
     show(a.href, cover, nm, win);
   },true);
   window.__goShow=show;
 }

 function boot(){ initLang(); initGo(); }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
 else boot();
})();


/* ---------- "Sama'" ambient soundtrack ----------------------------------
   Plays by itself. No gate, no prompt. Falls back to starting on the first
   interaction when the browser blocks autoplay, and always fades in. */
(function(){
  var a = document.getElementById('bgm');
  if(!a) return;

  var KEY = 'si_music';                       // 'off' means the user muted it
  var VOL = 0.30;                             // gentle by design
  var btn = document.getElementById('sndBtn');
  var fadeT = null, wanted = (localStorage.getItem(KEY) !== 'off');
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  a.volume = 0;
  a.loop = true;

  function paint(){
    if(btn) btn.classList.toggle('on', wanted && !a.paused);
  }
  function fade(to, ms, done){
    clearInterval(fadeT);
    var from = a.volume, t0 = Date.now();
    fadeT = setInterval(function(){
      var p = Math.min(1, (Date.now()-t0)/ms);
      a.volume = Math.max(0, Math.min(1, from + (to-from)*p));
      if(p >= 1){ clearInterval(fadeT); if(done) done(); }
    }, 40);
  }
  function start(){
    if(!wanted) return;
    var pr = a.play();
    if(pr && pr.then){
      pr.then(function(){ fade(VOL, RM ? 600 : 4000); paint(); })
        .catch(function(){ arm(); });        // blocked -> wait for a gesture
    } else {
      fade(VOL, 4000); paint();
    }
  }
  function stop(){
    fade(0, 700, function(){ try{ a.pause(); }catch(e){} paint(); });
  }

  var armed = false;
  function arm(){
    if(armed) return;
    armed = true;
    var evs = ['pointerdown','touchstart','keydown','scroll','mousemove'];
    var kick = function(){
      evs.forEach(function(e){ document.removeEventListener(e, kick, true); });
      armed = false;
      start();
    };
    evs.forEach(function(e){ document.addEventListener(e, kick, {once:true, capture:true, passive:true}); });
  }

  if(btn){
    btn.addEventListener('click', function(){
      wanted = !wanted;
      localStorage.setItem(KEY, wanted ? 'on' : 'off');
      if(wanted) start(); else stop();
      paint();
    });
  }

  // pause politely when the tab is hidden, resume when it comes back
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){
      if(!a.paused) fade(0, 400, function(){ a.pause(); });
    } else if(wanted){
      a.play().then(function(){ fade(VOL, 1400); paint(); }).catch(function(){});
    }
  });

  a.addEventListener('play', paint);
  a.addEventListener('pause', paint);

  if(wanted) start(); else paint();
})();
