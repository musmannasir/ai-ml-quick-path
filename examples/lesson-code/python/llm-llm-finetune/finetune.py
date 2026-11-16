# From lesson 'llm-finetune' (llm). Code status: Python LoRA arithmetic executed 2026-11-02 (quickpath.py lora); TRL training conceptual; added technique snippets (2026-11-05) not run
from datasets import load_dataset
from peft import LoraConfig
from trl import SFTConfig, SFTTrainer
train = load_dataset("json", data_files="train.jsonl")["train"]
trainer = SFTTrainer(model="<open model you are licensed to use>", train_dataset=train,
                     peft_config=LoraConfig(r=16, lora_alpha=32, target_modules="all-linear", task_type="CAUSAL_LM"),
                     args=SFTConfig(output_dir="adapter", num_train_epochs=2, learning_rate=2e-4, bf16=True))
trainer.train(); trainer.save_model("adapter")
