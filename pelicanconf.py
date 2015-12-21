#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

AUTHOR = 'Robin Berghuijs'
SITEURL = 'http://robin.berghuijs.design/'

PATH = 'content'

TIMEZONE = 'Europe/Amsterdam'

DEFAULT_LANG = 'nl'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# Blogroll
# LINKS = (('Pelican', 'http://getpelican.com/'),
#          ('Python.org', 'http://python.org/'),
#          ('Jinja2', 'http://jinja.pocoo.org/'),
#          ('You can modify those links in your config file', '#'),)

# Social widget
# SOCIAL = (('You can add links in your config file', '#'),
#           ('Another social link', '#'),)

DEFAULT_PAGINATION = 10

# Uncomment following line if you want document-relative URLs when developing
RELATIVE_URLS = True

PLUGIN_PATHS = ['pelican-plugins']
PLUGINS = ['i18n_subsites','neighbors','sitemap']

# these are the defaults
SITEMAP = {
    'format': 'xml',
#     'priorities': {
#         'articles': 0.5,
#         'indexes': 0.5,
#         'pages': 0.5
#     },
#     'changefreqs': {
#         'articles': 'monthly',
#         'indexes': 'daily',
#         'pages': 'monthly'
#     }
}

THEME = 'themes/flobin'
OUTPUT_PATH = 'output/'
SITENAME = 'Robin Berghuijs Design'
INDEX_SAVE_AS = 'blog/index.html'
INDEX_URL = 'blog'
MENUITEMS = [
    ('Blog', 'blog/index.html')
]
CSS_FILE = 'main.css'

I18N_SUBSITES = {
    # 'nl': {
    #     'THEME': 'themes/flobin',
    #     'OUTPUT_PATH': 'output/',
    #     'SITENAME': 'Robin Berghuijs Design',
    #     'INDEX_SAVE_AS': 'nieuws.html',
    #     'MENUITEMS': [
    #         ('Nieuws','nieuws.html'),
    #     ],
    # },
    'en': {
        'THEME': 'themes/flobin',
        'OUTPUT_PATH': 'output/en/',
        'SITENAME': 'Robin Berghuijs Design',
        'INDEX_SAVE_AS': 'blog/index.html',
        'MENUITEMS': [
            ('Blog','blog/index.html'),
        ],
    }
}

DELETE_OUTPUT_DIRECTORY = True

PAGE_URL = '{slug}/'
PAGE_SAVE_AS = '{slug}/index.html'
ARTICLE_URL = 'blog/{date:%Y}/{date:%m}/{date:%d}/{slug}/'
ARTICLE_SAVE_AS = 'blog/{date:%Y}/{date:%m}/{date:%d}/{slug}/index.html'
YEAR_ARCHIVE_SAVE_AS = 'blog/{date:%Y}/index.html'
MONTH_ARCHIVE_SAVE_AS = 'blog/{date:%Y}/{date:%m}/index.html'
DAY_ARCHIVE_SAVE_AS = ''
AUTHOR_SAVE_AS = ''

STATIC_PATHS = ['extra/robots.txt', 'extra/humans.txt', 'extra/favicon.ico', 'extra/favicon.png']
EXTRA_PATH_METADATA = {
    'extra/robots.txt': {'path': 'robots.txt'},
    'extra/humans.txt': {'path': 'humans.txt'},
    'extra/favicon.ico': {'path': 'favicon.ico'},
    'extra/favicon.png': {'path': 'favicon.png'},
}
