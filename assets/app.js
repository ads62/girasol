(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  let lenis = null;

  /* ---------- menu mobile (funciona sem GSAP) ---------- */
  const burger = $('.burger');
  const sheet = $('#sheet');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    sheet.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
    else body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false); });

  /* ---------- contadores / âncoras ---------- */
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      if (body.classList.contains('menu-open')) setMenu(false);
      requestAnimationFrame(() => scrollToTarget(id === '#topo' ? 0 : target));
    });
  });

  /* ---------- nav: sólido e esconde ao descer ---------- */
  const nav = $('#nav');
  let lastY = 0;
  const onScrollNav = () => {
    const y = scrollY;
    nav.classList.toggle('nav--solid', y > 40);
    if (!body.classList.contains('menu-open')) nav.classList.toggle('nav--hidden', y > lastY && y > 300);
    lastY = y;
  };
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  if (!hasGsap) return; // sem GSAP o site continua totalmente legível e funcional

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- smooth scroll (Lenis) integrado ao ScrollTrigger ---------- */
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- cursor customizado (somente mouse) ---------- */
  const initCursor = () => {
    if (!finePointer) return;
    const ring = document.createElement('div');
    ring.className = 'cursor';
    ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<div class="cursor__ring"><span class="cursor__label"></span></div>';
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    body.append(ring, dot);
    html.classList.add('has-cursor');

    const label = $('.cursor__label', ring);
    gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
    const d = reduce ? 0 : 0.55;
    const rx = gsap.quickTo(ring, 'x', { duration: d, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: d, ease: 'power3' });
    const dx = gsap.quickTo(dot, 'x', { duration: reduce ? 0 : 0.1, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: reduce ? 0 : 0.1, ease: 'power3' });

    let shown = false;
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (!shown) {
        gsap.set([ring, dot], { x: e.clientX, y: e.clientY });
        ring.classList.add('on'); dot.classList.add('on'); shown = true;
      }
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const lab = t.closest('[data-cursor]');
      const link = t.closest('a, button, [data-magnetic]');
      const light = !!t.closest('.is-light');
      ring.classList.toggle('is-light', light);
      dot.classList.toggle('is-light', light);
      ring.classList.toggle('is-label', !!lab);
      ring.classList.toggle('is-btn', !!t.closest('[data-magnetic]'));
      ring.classList.toggle('is-link', !!link && !lab);
      dot.classList.toggle('is-hidden', !!lab);
      if (lab) label.textContent = lab.dataset.cursor;
    });
    document.documentElement.addEventListener('pointerleave', () => { ring.classList.remove('on'); dot.classList.remove('on'); shown = false; });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { ring.classList.remove('on'); dot.classList.remove('on'); shown = false; } });

    /* magnético nos botões */
    if (!reduce) {
      $$('[data-magnetic]').forEach((el) => {
        const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
        const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          mx((e.clientX - (r.left + r.width / 2)) * 0.28);
          my((e.clientY - (r.top + r.height / 2)) * 0.28);
        });
        el.addEventListener('pointerleave', () => { mx(0); my(0); });
      });
    }
  };
  initCursor();

  if (reduce) { ScrollTrigger.refresh(); return; } // movimento reduzido: conteúdo estático

  html.classList.add('anim');

  /* ---------- barra de progresso ---------- */
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

  /* ---------- intro do hero ---------- */
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from('.hero__ghost', { scale: 0.82, opacity: 0, duration: 2.4 }, 0)
    .from('.hero__line', { yPercent: 115, duration: 1.5, stagger: 0.13 }, 0.15)
    .from('.hero__eyebrow, .hero__sub, .hero__cta > *, .hero__rating', { y: 26, opacity: 0, duration: 1.1, stagger: 0.09 }, 0.65)
    .from('.hero__arch', { clipPath: 'inset(100% 0 0 0)', duration: 1.7, ease: 'power4.inOut' }, 0.25)
    .from('.hero__outline, .badge', { opacity: 0, duration: 1.2 }, 1.1)
    .from('.nav__inner', { y: -40, opacity: 0, duration: 1.1 }, 0.5);

  /* ---------- reveals genéricos ---------- */
  const revealMasks = (scope) => {
    $$('.mask > span', scope).forEach((s) => {
      gsap.from(s, { yPercent: 110, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 90%', once: true } });
    });
  };
  ['.vis__head', '.collection__head', '.insta', '.where'].forEach((s) => { const el = $(s); if (el) revealMasks(el); });

  const fadeUp = (targets, trigger, extra = {}) => {
    gsap.from(targets, { y: 36, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger, start: 'top 85%', once: true }, ...extra });
  };
  fadeUp('.collection__head p', '.collection__head');
  fadeUp('.insta__id, .insta__bio, .stats li, .insta .btn', '.insta__wrap');
  fadeUp('.where address, .where__meta, .where__actions > *, .where__tel', '.where__wrap');
  fadeUp('.foot__row > *', '.foot', { y: 20 });

  /* contadores da nota */
  const count = (el, to, decimals, dur) => {
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = o.v.toFixed(decimals).replace('.', ','); }, scrollTrigger: { trigger: '.score', start: 'top 80%', once: true } });
  };
  count($('#scoreNum'), 5, 1, 1.8);
  count($('#reviewCount'), 98, 0, 2);

  /* depoimentos */
  $$('.quote').forEach((q) => {
    gsap.from(q, { y: 50, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: q, start: 'top 88%', once: true } });
  });
  gsap.from('.mosaic a', { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'power4.inOut', stagger: 0.12, scrollTrigger: { trigger: '.mosaic', start: 'top 80%', once: true } });
  gsap.from('.radar', { scale: 0.85, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.radar', start: 'top 85%', once: true } });

  /* ---------- seções dependentes de breakpoint ---------- */
  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, (ctx) => {
    const { desktop } = ctx.conditions;

    /* parallax em camadas (reduzido no mobile) */
    const k = desktop ? 1 : 0.45;
    $$('[data-parallax]').forEach((el) => {
      const s = parseFloat(el.dataset.parallax) * k;
      gsap.fromTo(el, { yPercent: -s }, { yPercent: s, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* emblema fantasma gira com o scroll */
    gsap.to('.hero__ghost', { rotate: desktop ? 110 : 60, yPercent: desktop ? 14 : 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__content', { yPercent: desktop ? -10 : 0, opacity: desktop ? 0.2 : 1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true } });
    gsap.to('.hero__media', { yPercent: desktop ? -6 : 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    if (desktop) {
      /* ----- Visagismo: seção fixa, o scroll troca passo, texto e imagem ----- */
      const steps = $$('.vis__step');
      const imgs = $$('.vis__img');
      gsap.set(steps.slice(1), { autoAlpha: 0, y: 50 });
      gsap.set(imgs.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(imgs.map((i) => $('img', i)), { scale: 1.18 });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.vis', start: 'top top', end: '+=300%', pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true }
      });
      tl.to('.vis__bar i', { scaleY: 1, duration: 3 }, 0);
      tl.to($('img', imgs[0]), { scale: 1, duration: 1 }, 0);
      [1, 2].forEach((i) => {
        const at = i - 0.15;
        tl.to(steps[i - 1], { autoAlpha: 0, y: -50, duration: 0.3 }, at)
          .to(steps[i], { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.2)
          .to(imgs[i], { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5 }, at)
          .to($('img', imgs[i]), { scale: 1, duration: 1 }, at);
      });
      tl.to({}, { duration: 0.35 }); // respiro final

      /* ----- Coleção: rail horizontal controlado pelo scroll ----- */
      const track = $('#railTrack');
      const rail = $('#rail');
      const dist = () => Math.max(0, track.scrollWidth - rail.clientWidth);
      const move = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.collection', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true }
      });
      $$('.slide__frame img').forEach((img) => {
        gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentElement, containerAnimation: move, start: 'left right', end: 'right left', scrub: true } });
      });
    }

    return () => { /* o matchMedia reverte tweens e triggers; nada fora do contexto para limpar */ };
  });

  /* ---------- recalcula depois de fontes e imagens ---------- */
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  addEventListener('load', refresh);
})();
