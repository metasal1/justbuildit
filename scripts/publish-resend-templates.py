#!/usr/bin/env python3
"""Publish justbuildit.lol on-brand Resend templates.

  python3 scripts/publish-resend-templates.py

Writes: ~/.credentials/resend-justbuildit-templates.json
"""
from __future__ import annotations

import json
import pathlib
import sys
import urllib.error
import urllib.request

API = "https://api.resend.com"
UA = "justbuildit-templates/1.0"
KEY_PATH = pathlib.Path.home() / ".credentials" / "resend-justbuildit.txt"
OUT = pathlib.Path.home() / ".credentials" / "resend-justbuildit-templates.json"

BG = "#000000"
CARD = "#0a0a0a"
BORDER = "rgba(255,255,255,0.12)"
PRIMARY = "#14f195"  # solana green
PURPLE = "#9945ff"
MAGENTA = "#dc1fff"
TEXT = "#ffffff"
MUTED = "rgba(255,255,255,0.65)"
SITE = "https://justbuildit.lol"
SOLANA_NEW = "https://solana.new"
X = "https://x.com/metasal_"
TG = "https://t.me/metasalxyz"
METASAL = "https://metasal.xyz"
FROM = "just build it <noreply@justbuildit.lol>"
FONT = "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"


def load_key() -> str:
    if not KEY_PATH.exists():
        sys.exit(f"missing {KEY_PATH}")
    k = KEY_PATH.read_text().strip()
    if not k.startswith("re_"):
        sys.exit("bad resend key")
    return k


def api(key: str, method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        API + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {key}",
            "User-Agent": UA,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            raw = res.read().decode()
            return res.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw) if raw else {}
        except Exception:
            payload = {"raw": raw}
        return e.code, payload


def shell(preheader: str, title: str, body: str, cta_label: str | None = None, cta_href: str | None = None) -> str:
    cta = ""
    if cta_label and cta_href:
        cta = (
            '<tr><td style="padding:8px 28px 28px">'
            f'<a href="{cta_href}" target="_blank" rel="noopener noreferrer" '
            f'style="display:inline-block;background:{PRIMARY};color:#000;text-decoration:none;'
            "font-weight:900;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;"
            f'font-family:{FONT};padding:14px 22px;border-radius:10px">'
            f"{cta_label}</a></td></tr>"
        )
    grad = f"linear-gradient(90deg,{PURPLE} 0%,{PRIMARY} 50%,{MAGENTA} 100%)"
    return (
        "<!DOCTYPE html>\n"
        '<html lang="en">\n'
        "<head>\n"
        '  <meta charset="utf-8"/>\n'
        '  <meta name="viewport" content="width=device-width,initial-scale=1"/>\n'
        '  <meta name="color-scheme" content="dark"/>\n'
        f"  <title>{title}</title>\n"
        "</head>\n"
        f'<body style="margin:0;padding:0;background:{BG};color:{TEXT}">\n'
        f'  <div style="display:none;max-height:0;overflow:hidden;opacity:0">{preheader}</div>\n'
        f'  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{BG};padding:32px 12px">\n'
        '    <tr><td align="center">\n'
        f'      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:{CARD};border:1px solid {BORDER};border-radius:16px;overflow:hidden">\n'
        f'        <tr><td style="height:4px;background:{grad};font-size:0;line-height:0">&nbsp;</td></tr>\n'
        '        <tr><td style="padding:28px 28px 8px" align="left">\n'
        f'          <div style="font-family:{FONT};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:{PRIMARY};font-weight:700">just build it</div>\n'
        f'          <div style="font-family:{FONT};font-size:13px;color:{MUTED};margin-top:4px">stop overthinking. ship something.</div>\n'
        "        </td></tr>\n"
        f'        <tr><td style="padding:12px 28px 4px">\n'
        f'          <h1 style="margin:0;font-family:{FONT};font-size:26px;line-height:1.2;color:{TEXT};font-weight:900;letter-spacing:-0.02em">{title}</h1>\n'
        "        </td></tr>\n"
        f'        <tr><td style="padding:12px 28px 8px;font-family:{FONT};font-size:15px;line-height:1.65;color:{MUTED}">\n'
        f"          {body}\n"
        "        </td></tr>\n"
        f"        {cta}\n"
        '        <tr><td style="padding:8px 28px 24px">\n'
        f'          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid {BORDER}">\n'
        f'            <tr><td style="padding-top:18px;font-family:{FONT};font-size:12px;line-height:1.5;color:{MUTED}">\n'
        f'              <a href="{SITE}" style="color:{PRIMARY};text-decoration:none">justbuildit.lol</a>\n'
        "              &nbsp;·&nbsp;\n"
        f'              <a href="{SOLANA_NEW}" style="color:{PRIMARY};text-decoration:none">solana.new</a>\n'
        "              &nbsp;·&nbsp;\n"
        f'              <a href="{X}" style="color:{PRIMARY};text-decoration:none">@metasal_</a>\n'
        "              &nbsp;·&nbsp;\n"
        f'              <a href="{TG}" style="color:{PRIMARY};text-decoration:none">telegram</a>\n'
        "            </td></tr>\n"
        "          </table>\n"
        "        </td></tr>\n"
        "      </table>\n"
        f'      <p style="margin:16px 0 0;font-family:{FONT};font-size:11px;color:rgba(255,255,255,0.35)">just build it · by metasal · <a href="{METASAL}" style="color:rgba(255,255,255,0.45);text-decoration:none">metasal.xyz</a></p>\n'
        "    </td></tr>\n"
        "  </table>\n"
        "</body>\n"
        "</html>"
    )


# Triple-brace Resend vars — never inside Python f-strings that expand identifiers.
CONFIRM_BODY = (
    '<p style="margin:0 0 12px;color:#ffffff">you\'re on the list.</p>'
    '<p style="margin:0 0 12px">thanks for subscribing to <strong style="color:#14f195">just build it</strong>.</p>'
    '<p style="margin:0 0 12px">stop overthinking. start shipping. one weekend beats a six-month roadmap.</p>'
    f'<p style="margin:0">ready? open <a href="{SOLANA_NEW}" style="color:{PRIMARY};text-decoration:underline">solana.new</a> and ship something today.</p>'
)

NOTIFY_BODY = (
    '<p style="margin:0 0 12px;color:#ffffff">new subscriber</p>'
    '<p style="margin:0 0 8px"><strong style="color:#14f195">{{{CONTACT_EMAIL}}}</strong></p>'
    '<p style="margin:0 0 8px;color:rgba(255,255,255,0.55)">source: {{{SOURCE}}}</p>'
    '<p style="margin:0;color:rgba(255,255,255,0.55)">ip: {{{IP}}}</p>'
)


TEMPLATES = [
    {
        "name": "JBI Subscribe Confirm",
        "alias": "jbi-subscribe-confirm",
        "from": FROM,
        "subject": "you're in. now go ship something.",
        "html": shell(
            "you're on the just build it list — time to ship.",
            "you're in.",
            CONFIRM_BODY,
            cta_label="ship it →",
            cta_href=SOLANA_NEW,
        ),
        "variables": [],
    },
    {
        "name": "JBI Subscribe Notify",
        "alias": "jbi-subscribe-notify",
        "from": FROM,
        "subject": "new sub · {{{CONTACT_EMAIL}}}",
        "html": shell(
            "new justbuildit.lol subscriber",
            "new sub",
            NOTIFY_BODY,
            cta_label="open site",
            cta_href=SITE,
        ),
        "variables": [
            {"key": "CONTACT_EMAIL", "type": "string", "fallbackValue": ""},
            {"key": "SOURCE", "type": "string", "fallbackValue": "homepage"},
            {"key": "IP", "type": "string", "fallbackValue": "—"},
        ],
    },
]


def list_by_alias(key: str) -> dict[str, dict]:
    status, data = api(key, "GET", "/templates")
    if status >= 300:
        print("list failed", status, data)
        return {}
    out = {}
    for t in data.get("data") or []:
        alias = t.get("alias")
        if alias:
            out[alias] = t
    return out


def upsert(key: str, tpl: dict) -> dict:
    existing = list_by_alias(key).get(tpl["alias"])
    payload = {
        "name": tpl["name"],
        "alias": tpl["alias"],
        "from": tpl["from"],
        "subject": tpl["subject"],
        "html": tpl["html"],
        "variables": tpl["variables"],
    }
    if existing and existing.get("id"):
        tid = existing["id"]
        status, data = api(key, "PATCH", f"/templates/{tid}", payload)
        action = "patch"
    else:
        status, data = api(key, "POST", "/templates", payload)
        action = "create"
        tid = data.get("id")
    if status >= 300 or not tid:
        print(f"FAIL {action} {tpl['alias']}", status, data)
        sys.exit(1)
    # publish required
    pstatus, pdata = api(key, "POST", f"/templates/{tid}/publish", {})
    if pstatus >= 300:
        print(f"FAIL publish {tpl['alias']}", pstatus, pdata)
        sys.exit(1)
    print(f"OK {action}+publish {tpl['alias']} → {tid}")
    return {
        "id": tid,
        "alias": tpl["alias"],
        "name": tpl["name"],
        "subject": tpl["subject"],
        "status": pstatus,
    }


def main() -> None:
    key = load_key()
    results = {}
    for tpl in TEMPLATES:
        results[tpl["alias"]] = upsert(key, tpl)
    OUT.write_text(json.dumps(results, indent=2) + "\n")
    OUT.chmod(0o600)
    print("wrote", OUT)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
