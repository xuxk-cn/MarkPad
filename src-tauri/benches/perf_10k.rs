// 性能压测基准：1 万行 Markdown 文档
//
// 运行：
//   cd src-tauri && cargo bench --bench perf_10k
//
// 测量指标：
//   1. Rope 全量替换 (set_all) — 模拟打开大文件
//   2. Rope 增量插入 (insert)    — 模拟单字符输入
//   3. Rope 随机删除              — 模拟块删除
//   4. pulldown-cmark 全量解析   — 模拟首次渲染 / 全文刷新
//   5. pulldown-cmark 块级解析   — 模拟增量渲染

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use ropey::Rope;
use pulldown_cmark::{Options, Parser};

const FIXTURE_10K: &str = include_str!("../../tests/fixtures/10k.md");

// ── Rope 全量替换 ──────────────────────────────────────────────────────────

fn bench_rope_set_all(c: &mut Criterion) {
    c.bench_function("rope_set_all(10k)", |b| {
        b.iter(|| {
            let mut rope = Rope::new();
            rope.insert(0, black_box(FIXTURE_10K));
            black_box(rope.len_chars());
        })
    });
}

// ── Rope 单字符追加（模拟逐字输入） ─────────────────────────────────────────

fn bench_rope_append_char(c: &mut Criterion) {
    let mut rope = Rope::from_str(FIXTURE_10K);
    c.bench_function("rope_append_char(10k)", |b| {
        b.iter(|| {
            let ch = black_box('x');
            let len = rope.len_chars();
            rope.insert(len, &ch.to_string());
            black_box(rope.len_chars());
        })
    });
}

// ── Rope 中间插入（模拟编辑） ──────────────────────────────────────────────

fn bench_rope_insert_mid(c: &mut Criterion) {
    let mut rope = Rope::from_str(FIXTURE_10K);
    let mid = rope.len_chars() / 2;
    c.bench_function("rope_insert_mid(10k)", |b| {
        b.iter(|| {
            rope.insert(mid, black_box("Hello, world!"));
            black_box(rope.len_chars());
        })
    });
}

// ── Rope 随机删除 ──────────────────────────────────────────────────────────

fn bench_rope_delete_random(c: &mut Criterion) {
    c.bench_function("rope_delete_100chars(10k)", |b| {
        b.iter(|| {
            let mut rope = Rope::from_str(FIXTURE_10K);
            let len = rope.len_chars();
            let start = len / 3;
            let end = (start + 100).min(len);
            rope.remove(start..end);
            black_box(rope.len_chars());
        })
    });
}

// ── pulldown-cmark 全量解析 ────────────────────────────────────────────────

fn bench_pulldown_parse_all(c: &mut Criterion) {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    c.bench_function("pulldown_parse_all(10k)", |b| {
        b.iter(|| {
            let parser = Parser::new_ext(black_box(FIXTURE_10K), options);
            let count = parser.count();
            black_box(count);
        })
    });
}

// ── pulldown-cmark 带偏移（块级解析） ──────────────────────────────────────

fn bench_pulldown_offset_iter(c: &mut Criterion) {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    c.bench_function("pulldown_offset_iter(10k)", |b| {
        b.iter(|| {
            let parser = Parser::new_ext(black_box(FIXTURE_10K), options).into_offset_iter();
            let count = parser.count();
            black_box(count);
        })
    });
}

// ── 读取全文（to_string） ──────────────────────────────────────────────────

fn bench_rope_to_string(c: &mut Criterion) {
    let rope = Rope::from_str(FIXTURE_10K);
    c.bench_function("rope_to_string(10k)", |b| {
        b.iter(|| {
            black_box(rope.to_string());
        })
    });
}

criterion_group!(
    benches,
    bench_rope_set_all,
    bench_rope_append_char,
    bench_rope_insert_mid,
    bench_rope_delete_random,
    bench_pulldown_parse_all,
    bench_pulldown_offset_iter,
    bench_rope_to_string,
);
criterion_main!(benches);