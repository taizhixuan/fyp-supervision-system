---
tags: [folder/ai-proposal-analyzer, path/ai-proposal-analyzer\data\readme, component/data]
---
# Training Data for Proposal Analyzer

## ASAP Automated Essay Scoring (AES) Dataset

The proposal quality scorer is trained on the ASAP AES dataset from Kaggle.

### Download Instructions

1. Go to: https://www.kaggle.com/competitions/asap-aes/data
2. Download `training_set.tsv`
3. Place it in this directory: `ai-proposal-analyzer/data/training_set.tsv`

### Dataset Details

- **Size**: ~13,000 essays
- **Format**: TSV (tab-separated values)
- **Key columns**: `essay_id`, `essay_set`, `essay`, `domain1_score`
- **Scoring**: 8 essay sets with different scoring rubrics (all normalized to 0-1 during training)

### Training

```bash
# From ai-proposal-analyzer directory:
python train_model.py --dataset data/training_set.tsv --epochs 3

# Or on Google Colab (with GPU):
!python train_model.py --dataset data/training_set.tsv --epochs 3 --batch_size 32
```

### Fallback

If the ASAP dataset is not available, `train_model.py` will automatically generate
synthetic training data for testing purposes. The synthetic data is useful for
verifying the training pipeline works, but the real ASAP dataset produces a
significantly better model.

### Output

Trained model is saved to `models/essay_scorer/` with:
- `config.json` - Model configuration
- `model.safetensors` - Model weights
- `tokenizer_config.json` - Tokenizer configuration
- `vocab.txt` - Vocabulary
- `training_metrics.json` - Training metrics and evaluation results
