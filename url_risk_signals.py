import tldextract

def suspicious_tld(url):
    ext = tldextract.extract(url)
    suspicious = ["xyz", "top", "work", "info", "click"]
    return ext.suffix.lower() in suspicious


def many_hyphens(url):
    ext = tldextract.extract(url)
    domain = ext.domain.lower()
    return domain.count('-') >= 3


def is_long_url(url):
    return len(url) > 75


def has_many_subdomains(url):
    ext = tldextract.extract(url)
    subdomain = ext.subdomain.lower()
    if not subdomain:
        return False
    return subdomain.count('.') >= 2