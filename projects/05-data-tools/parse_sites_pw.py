"""无头 Chrome 正常操作解析站网页，输出一行 JSON。用法: parse_sites_pw.py <kukutool|snapany|snapany_yt> <视频链接>"""
import sys, re, json, asyncio
from playwright.async_api import async_playwright
SITES = {"kukutool": "https://dy.kukutool.com/", "snapany": "https://snapany.com/zh", "snapany_yt": "https://snapany.com/zh/youtube"}
VID = re.compile(r"(douyinvod\.com|zjcdn\.com|amemv\.com|bytecdn|googlevideo\.com)", re.I)
async def main(site, url):
    out = {"site": SITES[site].split("/")[2], "url": None}
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=True)
        pg = await (await b.new_context(locale="zh-CN", user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")).new_page()
        pg.on("popup", lambda pp: asyncio.ensure_future(pp.close()))
        await pg.goto(SITES[site], timeout=45000, wait_until="domcontentloaded")
        inp = pg.locator("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):visible, textarea:visible").first
        await inp.wait_for(timeout=20000); await inp.fill(url); await inp.press("Enter"); await pg.wait_for_timeout(1500)
        for sel in ["button[type=submit]", "button:has-text('解析')", "button:has-text('提取')", "button:has-text('下载')", "button:has-text('Download')"]:
            loc = pg.locator(sel + ":visible")
            if await loc.count():
                try: await loc.first.click(timeout=3000)
                except Exception: pass
                break
        links = []
        for k in range(45):
            await pg.wait_for_timeout(1000)
            if k in (3, 10, 20):   # 关掉站点的提示弹窗（如“批量解析”推荐），再点一次解析
                for t in ["7天不再提示", "不再提示", "关闭", "我知道了"]:
                    loc = pg.get_by_text(t, exact=True)
                    if await loc.count() and await loc.first.is_visible():
                        try: await loc.first.click(timeout=2000); await pg.wait_for_timeout(500)
                        except Exception: pass
                        b2 = pg.get_by_text(re.compile(r"^\s*(开始解析|提取视频图片|解析)\s*$"))
                        if await b2.count():
                            try: await b2.first.click(timeout=3000)
                            except Exception: pass
                        break
            links = await pg.eval_on_selector_all("a[href]", "els=>els.map(e=>[e.href,(e.innerText||'').trim()])")
            links = [l for l in links if VID.search(l[0])]
            if links: await pg.wait_for_timeout(1500); links = [l for l in await pg.eval_on_selector_all("a[href]", "els=>els.map(e=>[e.href,(e.innerText||'').trim()])") if VID.search(l[0])]; break
        if not links: await pg.screenshot(path=f"/tmp/pw_fail_{site}.png"); out["note"] = "45 秒内页面未出现下载链接"; print(json.dumps(out, ensure_ascii=False)); await b.close(); return
        try: out["title"] = (await pg.locator("h1,h2,h3").filter(has_text=re.compile(r"\S")).all_inner_texts())[1][:200]
        except Exception: pass
        if site.endswith("_yt"):
            it = lambda n: next((h for h, _ in links if f"itag={n}&" in h), None)
            v = it(137) or it(136) or it(135); a = it(140)
            out.update(url=it(18), video_only_url=v, audio_url=a, quality="360p 含音轨（itag18）" + ("；另有无声高清+音轨可合并" if v and a else ""))
        else:
            def res(t): m = re.search(r"(\d{3,4})p", t); return int(m.group(1)) if m else 0
            best = sorted(links, key=lambda l: res(l[1]))[-1]
            out.update(url=best[0], quality=(f"{res(best[1])}p" if res(best[1]) else "默认档"))
        print(json.dumps(out, ensure_ascii=False)); await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2]))
