from app.services.links import evaluate_links

def test_shortened_url():
    res = evaluate_links("Check this out", ["https://bit.ly/12345"])
    assert res["score"] > 0

def test_suspicious_tld():
    res = evaluate_links("Check this", ["https://example.xyz"])
    assert res["score"] > 0

def test_ip_url():
    res = evaluate_links("IP", ["http://192.168.1.1"])
    assert res["score"] > 0

def test_missing_https():
    res = evaluate_links("http", ["http://example.com"])
    assert res["score"] > 0

def test_no_links():
    res = evaluate_links("Hello world", [])
    assert res["score"] == 0 # we fixed this to be 0 risk if no links
