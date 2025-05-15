from setuptools import setup, find_packages

setup(
    name="context_graph",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "pinecone",
        "openai",
        "python-dotenv",
        "datasets",
        "evaluate",
        "sentence-transformers",
        "requests",
    ],
    python_requires=">=3.8",
) 