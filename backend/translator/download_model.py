import ctranslate2, os

OUT = "nllb-600M-int8"
if not os.path.exists(OUT):
    print("Converting NLLB-200-distilled-600M to CTranslate2 int8…")
    from ctranslate2.converters import TransformersConverter
    TransformersConverter("facebook/nllb-200-distilled-600M").convert(OUT, quantization="int8")
    print("Done →", OUT)
else:
    print("Model already present:", OUT)