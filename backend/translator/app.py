import ctranslate2
from transformers import AutoTokenizer
from flask import Flask, request, jsonify

MODEL = "nllb-600M-int8"
TOK = "nllb-600M-int8"

# StatTips code -> NLLB FLORES-200 code
LANG = {
    "en": "eng_Latn", "af": "afr_Latn", "zu": "zul_Latn", "xh": "xho_Latn",
    "nso": "nso_Latn", "tn": "tsn_Latn", "st": "sot_Latn", "ts": "tso_Latn",
    "ss": "ssw_Latn", "ve": "ven_Latn", "nr": "nbl_Latn",
}

app = Flask(__name__)
translator = ctranslate2.Translator(MODEL, device="cpu", compute_type="int8")
tokenizer = AutoTokenizer.from_pretrained(TOK)


@app.post("/translate")
def translate():
    data = request.get_json(force=True)
    text = (data.get("text") or "").strip()
    src = LANG.get(data.get("source", "en"), "eng_Latn")
    tgt = LANG.get(data.get("target", "en"), "eng_Latn")
    if not text or src == tgt:
        return jsonify({"text": text})
    tokenizer.src_lang = src
    chunks = [s.strip() for s in text.split("\n") if s.strip()]
    out = []
    for chunk in chunks:
        source = tokenizer.convert_ids_to_tokens(tokenizer.encode(chunk))
        results = translator.translate_batch(
            [source], target_prefix=[[tgt]], beam_size=2, max_decoding_length=512,
        )
        tokens = results[0].hypotheses[0]
        if tokens and tokens[0] == tgt:
            tokens = tokens[1:]
        out.append(tokenizer.decode(tokenizer.convert_tokens_to_ids(tokens)))
    return jsonify({"text": "\n".join(out)})


@app.get("/health")
def health():
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)